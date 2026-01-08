<?php
/**
 * Briceka Panel - index.php
 * Final Version: Fixed Filtering, Load More, Global Search, and Back to Top
 */

$cache_file = 'panel_cache.json';
$refresh_requested = isset($_GET['refresh']);
$all_items = file_exists($cache_file) ? json_decode(file_get_contents($cache_file), true) : [];

if ($refresh_requested || empty($all_items) || (time() - filemtime($cache_file) > 7200)) {
    $feeds = [
        'Briceka' => 'https://briceka.com/feed/',
        'Onlycrave Blog' => 'https://onlycrave.com/rss',
        'Creators' => 'https://onlycrave.com/rss/creators/feed'
    ];

    $new_items = [];
    foreach ($feeds as $source => $url) {
        $rss = @simplexml_load_file($url, 'SimpleXMLElement', LIBXML_NOCDATA);
        if ($rss) {
            $namespaces = $rss->getNamespaces(true);
            foreach ($rss->channel->item as $item) {
                $link = (string)$item->link;
                $guid = md5($link);
                
                // Logic to find image in feed first
                $image = "";
                $desc = (string)$item->description;
                $content = isset($namespaces['content']) ? (string)$item->children($namespaces['content'])->encoded : "";
                
                // 1. Try to find image in description/content
                if (preg_match('/<img.+src=["\']([^"\']+)["\']/', $desc . $content, $matches)) {
                    $image = $matches[1];
                } 
                // 2. Try Media Enclosure (Common for OnlyCrave Blog)
                if (empty($image) && isset($item->enclosure)) {
                    $image = (string)$item->enclosure['url'];
                }

                $new_items[] = [
                    'title' => trim((string)$item->title),
                    'link' => $link,
                    'date' => strtotime((string)$item->pubDate),
                    'display_date' => date('M d, Y', strtotime((string)$item->pubDate)),
                    'full_html' => !empty($content) ? $content : $desc,
                    'preview' => mb_strimwidth(strip_tags($desc), 0, 120, "..."),
                    'image' => $image,
                    'source' => $source,
                    'is_creator' => ($source === 'Creators'),
                    'has_og' => !empty($image) 
                ];
            }
        }
    }

    // Advanced Scraping for missing images (Especially OnlyCrave Blog)
    $scraped_count = 0;
    foreach ($new_items as &$item) {
        if (!$item['has_og'] && $scraped_count < 10) { // Increased limit for fix
            $context = stream_context_create(["http" => ["timeout" => 5, "header" => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36\r\n"]]);
            $html = @file_get_contents($item['link'], false, $context);
            if ($html) {
                // Check og:image or twitter:image
                if (preg_match('/<meta [^>]*property=["\']og:image["\'][^>]*content=["\']([^"\']+)["\']/', $html, $matches) || 
                    preg_match('/<meta [^>]*name=["\']twitter:image["\'][^>]*content=["\']([^"\']+)["\']/', $html, $matches)) {
                    $item['image'] = $matches[1];
                    $item['has_og'] = true;
                }
            }
            if(empty($item['image'])) {
                $item['image'] = "https://briceka.com/wp-content/uploads/2026/01/UD_leialittle_3679631913716852596_74779933892_1_5_2026.jpg";
            }
            $scraped_count++;
        }
    }

    usort($new_items, function($a, $b) { return $b['date'] - $a['date']; });
    $all_items = $new_items;
    file_put_contents($cache_file, json_encode($all_items));
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Briceka Media Panel</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        :root { --brand: #0102FD; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: #f8fafc; scroll-behavior: smooth; }
        .card { display: none; transition: all 0.3s ease; border-radius: 2rem; border: 1px solid #e2e8f0; background: white; }
        .card.is-visible { display: flex; flex-direction: column; overflow: hidden; }
        .card:hover { transform: translateY(-8px); border-color: var(--brand); box-shadow: 0 20px 30px -10px rgba(1, 2, 253, 0.15); }
        .back-to-top { position: fixed; bottom: 30px; right: 30px; z-index: 99; opacity: 0; visibility: hidden; transition: 0.3s; }
        .back-to-top.show { opacity: 1; visibility: visible; }
        .modal-blur { backdrop-filter: blur(20px); background: rgba(15, 23, 42, 0.7); }
    </style>
</head>
<body class="antialiased">

    <button id="backToTop" onclick="window.scrollTo(0,0)" class="back-to-top w-14 h-14 bg-[#0102FD] text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95">
        <i class="fas fa-arrow-up"></i>
    </button>

    <nav class="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 bg-[#0102FD] rounded-xl flex items-center justify-center shadow-lg"><span class="text-white font-black text-xl">B</span></div>
                <span class="font-black text-xl tracking-tighter uppercase hidden md:block">Briceka <span class="text-[#0102FD]">Panel</span></span>
            </div>
            
            <div class="flex-1 max-w-md mx-6 relative group">
                <input type="text" id="searchInput" onkeyup="if(event.key==='Enter') globalSearch()" placeholder="Search site..." 
                       class="w-full bg-slate-100 border-none rounded-2xl py-2.5 pl-5 pr-12 text-sm focus:bg-white focus:ring-2 focus:ring-[#0102FD]/10 transition-all">
                <button onclick="globalSearch()" class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-[#0102FD] text-white rounded-xl shadow-md hover:scale-105 transition-transform">
                    <i class="fas fa-search text-xs"></i>
                </button>
            </div>

            <div class="flex items-center gap-6">
                <a href="?refresh=1" class="text-slate-400 hover:text-[#0102FD] transition-colors"><i class="fas fa-sync-alt"></i></a>
                <button onclick="switchTab('feed')" class="font-extrabold text-xs uppercase text-[#0102FD]">Feed</button>
                <button onclick="switchTab('donate')" class="font-extrabold text-xs uppercase text-slate-400">Donate</button>
            </div>
        </div>
    </nav>
    
    <main class="max-w-7xl mx-auto px-6 py-10">
        <div id="feedSection">
            <div class="flex flex-wrap gap-2 justify-center mb-12">
                <button id="filter-all" onclick="setFilter('all')" class="filter-btn active bg-[#0102FD] text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase shadow-lg">All Stories</button>
                <button id="filter-Briceka" onclick="setFilter('Briceka')" class="filter-btn bg-white border px-6 py-3 rounded-xl text-[10px] font-black uppercase text-slate-500 hover:border-[#0102FD]">Briceka</button>
                <button id="filter-Onlycrave Blog" onclick="setFilter('Onlycrave Blog')" class="filter-btn bg-white border px-6 py-3 rounded-xl text-[10px] font-black uppercase text-slate-500 hover:border-pink-500">Onlycrave</button>
                <button id="filter-Creators" onclick="setFilter('Creators')" class="filter-btn bg-white border px-6 py-3 rounded-xl text-[10px] font-black uppercase text-orange-600 hover:bg-orange-50">🔥 Creators</button>
            </div>

            <div id="itemGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <?php foreach ($all_items as $item): 
                    $is_new = (time() - $item['date']) < 86400;
                ?>
                <div class="card article-box" data-source="<?= $item['source'] ?>" data-title="<?= strtolower($item['title']) ?>">
                    <div class="h-60 overflow-hidden relative group">
                        <img src="<?= $item['image'] ?>" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy">
                        <?php if($is_new): ?>
                            <div class="absolute top-4 right-4 bg-[#0102FD] text-white text-[9px] font-black px-3 py-1 rounded-full shadow-lg border border-white/20">NEW</div>
                        <?php endif; ?>
                        <div class="absolute top-4 left-4 px-2 py-1 bg-white/80 backdrop-blur-sm rounded-lg text-[8px] font-bold uppercase shadow-sm"><?= $item['source'] ?></div>
                    </div>
                    <div class="p-8 flex flex-col flex-grow">
                        <h2 class="text-lg font-black mb-3 leading-tight"><?= $item['title'] ?></h2>
                        <p class="text-slate-500 text-xs mb-8 line-clamp-2"><?= $item['preview'] ?></p>
                        <div class="mt-auto flex items-center justify-between">
                            <span class="text-[9px] font-bold text-slate-300 uppercase"><?= $item['display_date'] ?></span>
                            <button onclick='openView(<?= htmlspecialchars(json_encode($item), ENT_QUOTES, 'UTF-8') ?>)' class="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#0102FD] transition-all">Open</button>
                        </div>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>

            <div class="mt-16 flex justify-center">
                <button id="loadMoreBtn" onclick="renderFeed(false)" class="bg-white border border-slate-200 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-[#0102FD] hover:text-[#0102FD] transition-all shadow-sm">Load More Stories</button>
            </div>
        </div>
        
        <div id="donateSection" class="hidden">
            <div class="max-w-4xl mx-auto bg-white p-2 rounded-[3.5rem] shadow-2xl">
                <iframe src='https://briceka.com/tools/donate/' class="w-full h-[75vh] rounded-[3rem]"></iframe>
            </div>
        </div>
    </main>

    <div id="viewModal" class="fixed inset-0 z-[200] hidden flex items-center justify-center p-4 modal-blur">
        <div class="bg-white w-full max-w-5xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col h-[90vh]">
            <div class="flex items-center justify-between px-8 py-4 border-b bg-slate-50/50">
                <div class="flex gap-3">
                    <button id="btn-reader" onclick="toggleMode('reader')" class="text-[10px] font-black uppercase bg-[#0102FD] text-white px-5 py-2.5 rounded-xl">Reading Mode</button>
                    <button id="btn-live" onclick="toggleMode('live')" class="text-[10px] font-black uppercase text-slate-400 px-5 py-2.5">Live Page</button>
                </div>
                <button onclick="closeView()" class="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:text-red-500 transition-all"><i class="fas fa-times"></i></button>
            </div>
            <div class="flex-grow overflow-hidden relative">
                <div id="reader-view" class="h-full overflow-y-auto p-10 md:p-14">
                    <img id="mv-img" class="w-full h-96 object-cover rounded-[2.5rem] mb-10 shadow-2xl">
                    <h2 id="mv-title" class="text-4xl font-black mb-8 leading-tight"></h2>
                    <div id="mv-content" class="text-slate-600 text-lg leading-relaxed space-y-4"></div>
                </div>
                <iframe id="live-view" class="hidden w-full h-full border-none"></iframe>
            </div>
            <div class="p-8 border-t bg-white flex justify-center">
                <a id="mv-link" href="#" target="_blank" class="flex items-center justify-center gap-3 w-full max-w-md py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all"></a>
            </div>
        </div>
    </div>

    <script>
        let currentFilter = 'all';
        let visibleCount = 0;
        const batchSize = 12;

        function renderFeed(reset = true) {
            const cards = Array.from(document.querySelectorAll('.article-box'));
            const searchVal = document.getElementById('searchInput').value.toLowerCase();
            if (reset) { visibleCount = 0; cards.forEach(c => c.classList.remove('is-visible')); }

            let newlyShown = 0;
            cards.forEach(card => {
                const matchesFilter = (currentFilter === 'all' || card.dataset.source === currentFilter);
                const matchesSearch = card.dataset.title.includes(searchVal);
                if (matchesFilter && matchesSearch) {
                    if (!card.classList.contains('is-visible') && newlyShown < batchSize) {
                        card.classList.add('is-visible');
                        newlyShown++;
                        visibleCount++;
                    }
                } else { card.classList.remove('is-visible'); }
            });
            const totalMatch = cards.filter(c => (currentFilter === 'all' || c.dataset.source === currentFilter) && c.dataset.title.includes(searchVal)).length;
            document.getElementById('loadMoreBtn').style.display = (visibleCount >= totalMatch) ? 'none' : 'block';
        }

        function setFilter(src) {
            currentFilter = src;
            document.querySelectorAll('.filter-btn').forEach(btn => btn.className = "filter-btn bg-white border px-6 py-3 rounded-xl text-[10px] font-black uppercase text-slate-500 hover:border-[#0102FD]");
            document.getElementById('filter-' + src).className = "filter-btn active bg-[#0102FD] text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase shadow-lg";
            renderFeed(true);
        }

        function globalSearch() {
            const query = document.getElementById('searchInput').value;
            if (query.trim().length > 0) {
                window.open(`https://www.google.com/search?q=site:briceka.com OR site:onlycrave.com ${encodeURIComponent(query)}`, '_blank');
            }
        }

        window.onscroll = function() {
            const btt = document.getElementById("backToTop");
            if (document.body.scrollTop > 500 || document.documentElement.scrollTop > 500) { btt.classList.add("show"); } 
            else { btt.classList.remove("show"); }
        };

        function openView(item) {
            document.getElementById('mv-img').src = item.image;
            document.getElementById('mv-title').innerText = item.title;
            document.getElementById('mv-content').innerHTML = item.full_html;
            document.getElementById('live-view').src = item.link;
            const mainBtn = document.getElementById('mv-link');
            mainBtn.href = item.link;
            if (item.is_creator) {
                mainBtn.className = "flex items-center justify-center gap-3 w-full max-w-md py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl bg-[#FF1493] text-white hover:scale-[1.02]";
                mainBtn.innerHTML = `<img src="https://onlycrave.com/public/img/favicon-1752387873.png" class="w-5 h-5"> Subscribe to ${item.title}`;
            } else {
                mainBtn.className = "flex items-center justify-center gap-3 w-full max-w-md py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl bg-[#0102FD] text-white hover:scale-[1.02]";
                mainBtn.innerHTML = `Read on Official Site <i class="fas fa-external-link-alt"></i>`;
            }
            toggleMode('reader');
            document.getElementById('viewModal').classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }

        function toggleMode(m) {
            document.getElementById('reader-view').classList.toggle('hidden', m === 'live');
            document.getElementById('live-view').classList.toggle('hidden', m === 'reader');
            document.getElementById('btn-reader').className = m === 'reader' ? "text-[10px] font-black uppercase bg-[#0102FD] text-white px-5 py-2.5 rounded-xl shadow-lg" : "text-[10px] font-black uppercase text-slate-400 px-5 py-2.5";
            document.getElementById('btn-live').className = m === 'live' ? "text-[10px] font-black uppercase bg-[#0102FD] text-white px-5 py-2.5 rounded-xl shadow-lg" : "text-[10px] font-black uppercase text-slate-400 px-5 py-2.5";
        }

        function closeView() { document.getElementById('viewModal').classList.add('hidden'); document.getElementById('live-view').src = ""; document.body.style.overflow = 'auto'; }
        function switchTab(v) { document.getElementById('feedSection').classList.toggle('hidden', v !== 'feed'); document.getElementById('donateSection').classList.toggle('hidden', v !== 'donate'); }
        renderFeed();
    </script>
</body>
</html>
