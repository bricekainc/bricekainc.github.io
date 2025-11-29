let currentPlatform = null;
const rssFeeds = [
  { site: "Briceka", url: "https://api.rss2json.com/v1/api.json?rss_url=https://briceka.com/feed/" },
  { site: "OnlyCrave (Blog)", url: "https://api.rss2json.com/v1/api.json?rss_url=https://onlycrave.com/rss/" },
  { site: "Trimd", url: "https://api.rss2json.com/v1/api.json?rss_url=https://trimd.cc/blog/rss.xml" }
];

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize search form
  document.getElementById('multiSearchForm').addEventListener('submit', searchAll);
  document.getElementById('clearResults').addEventListener('click', clearResults);
  
  // Load tag suggestions
  loadTagSuggestions();
});

// Search functionality
async function searchAll(e) {
  e?.preventDefault();
  const query = document.getElementById('searchQuery').value.trim().toLowerCase();
  
  if (!query) return;
  
  document.getElementById('clearResults').style.display = 'inline-block';
  const resultsContainer = document.getElementById('searchResults');
  
  // Show loading state
  resultsContainer.innerHTML = `
    <div class="col-span-2 flex items-center justify-center py-12">
      <div class="text-center">
        <div class="ring mx-auto mb-4"></div>
        <p class="text-slate-600 dark:text-slate-300">
          Searching "<strong class="text-slate-900 dark:text-white">${query}</strong>" across all platforms...
      </p>
    </div>
  `;
  
  let allResults = [];
  
  // Search through RSS feeds
  for (const feed of rssFeeds) {
    if (currentPlatform && !feed.site.includes(currentPlatform)) continue;
    
    try {
      const response = await fetch(feed.url);
      const data = await response.json();
      
      const matches = data.items.filter(item => 
        item.title.toLowerCase().includes(query) || 
        item.description.toLowerCase().includes(query)
      );
      
      matches.forEach(item => {
        allResults.push({
          site: feed.site,
          title: item.title,
          link: item.link,
          snippet: item.description
        });
      });
    } catch (error) {
      console.error(`Error searching ${feed.site}:`, error);
    }
  }
  
  // Display results
  if (!allResults.length) {
    resultsContainer.innerHTML = `
      <div class="col-span-2 text-center py-12">
        <p class="text-slate-600 dark:text-slate-300 mb-4">
          No results found for "<strong class="text-slate-900 dark:text-white">${query}</strong>"
        </p>
        <p class="text-slate-500 dark:text-slate-400 text-sm">
          Try using different keywords or check your spelling.
        </p>
      </div>
    `;
    return;
  }
  
  // Render results
  resultsContainer.innerHTML = '';
  allResults.forEach(result => {
    const isCreator = result.site.includes("Creators");
    const card = document.createElement('div');
    card.className = 'card bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300';
    
    card.innerHTML = `
      <div class="flex items-start justify-between mb-3">
        <span class="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-medium px-2 py-1 rounded-full">
          ${result.site}
        </span>
        <i data-feather="${isCreator ? 'user' : 'file-text'}" class="w-4 h-4 text-slate-400"></i>
      </div>
      <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          ${result.title}
        </h3>
      <p class="text-slate-600 dark:text-slate-300 text-sm mb-4">
          ${stripHtml(result.snippet).substring(0, 120)}...
        </p>
      <a href="${result.link}" target="_blank" class="inline-block bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg">
          ${isCreator ? 'View Creator' : 'Read More'}
        </a>
    `;
    
    resultsContainer.appendChild(card);
  });
  
  feather.replace();
}

// Clear results
function clearResults() {
  document.getElementById('searchQuery').value = '';
  document.getElementById('searchResults').innerHTML = '';
  document.getElementById('clearResults').style.display = 'none';
  document.getElementById('previewFrame').style.display = 'none';
}

// Strip HTML tags
function stripHtml(html) {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
}

// Load iframe preview
function loadIframe(url) {
  const iframe = document.getElementById('previewFrame');
  iframe.src = url;
  iframe.style.display = 'block';
  document.getElementById('searchResults').innerHTML = '';
  
  // Scroll to iframe
  iframe.scrollIntoView({ behavior: 'smooth' });
}

// Load tag suggestions
async function loadTagSuggestions() {
  const tags = new Set();
  
  // Extract tags from RSS feeds
  for (const feed of rssFeeds) {
    try {
      const response = await fetch(feed.url);
      const data = await response.json();
      
      data.items.slice(0, 8).forEach(item => {
      item.title.split(/\s+/).filter(word => word.length > 4).forEach(word => tags.add(word.toLowerCase()));
    } catch (error) {
      console.error(`Error loading tags from ${feed.site}:`, error);
    }
  }
  
  const tagArray = [...tags].slice(0, 10);
  const tagContainer = document.getElementById('tagSuggestions');
  
  tagArray.forEach(tag => {
    const tagElement = document.createElement('span');
    tagElement.className = 'tag';
    tagElement.textContent = tag;
    tagElement.onclick = () => {
      document.getElementById('searchQuery').value = tag;
      searchAll();
    };
    
    tagContainer.appendChild(tagElement);
  });
}

// Theme toggle
function toggleTheme() {
  const html = document.documentElement;
  html.classList.toggle('dark');
  
  // Update icon
  feather.replace();
}

// Performance monitoring
window.addEventListener('load', function() {
  // Lazy load images
  const lazyImages = document.querySelectorAll('img[data-src]');
  
  if ('IntersectionObserver' in window) {
    const lazyImageObserver = new IntersectionObserver(function(entries, observer) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          const lazyImage = entry.target;
          lazyImage.src = lazyImage.dataset.src;
      lazyImageObserver.unobserve(lazyImage);
        }
      });
    });
    
    lazyImages.forEach(function(lazyImage) {
      lazyImageObserver.observe(lazyImage);
    });
  }
});
