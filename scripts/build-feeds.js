import fs from "fs";
import Parser from "rss-parser";
import fetch from "node-fetch";
import cheerio from "cheerio";

const parser = new Parser();
const feeds = {
  "Briceka": "https://briceka.com/feed/",
  "Onlycrave Blog": "https://onlycrave.com/rss",
  "Creators": "https://onlycrave.com/rss/creators/feed"
};

let items = [];

for (const [source, url] of Object.entries(feeds)) {
  const feed = await parser.parseURL(url);

  for (const entry of feed.items) {
    let image = "";

    if (entry.content && entry.content.match(/<img.*?src="(.*?)"/)) {
      image = RegExp.$1;
    } else if (entry.enclosure?.url) {
      image = entry.enclosure.url;
    }

    if (!image && entry.link) {
      try {
        const html = await fetch(entry.link, { timeout: 5000 }).then(r => r.text());
        const $ = cheerio.load(html);
        image =
          $('meta[property="og:image"]').attr("content") ||
          $('meta[name="twitter:image"]').attr("content") ||
          "";
      } catch {}
    }

    if (!image) {
      image = "https://briceka.com/wp-content/uploads/2026/01/UD_leialittle_3679631913716852596_74779933892_1_5_2026.jpg";
    }

    items.push({
      title: entry.title?.trim(),
      link: entry.link,
      date: Math.floor(new Date(entry.pubDate).getTime() / 1000),
      display_date: new Date(entry.pubDate).toDateString(),
      full_html: entry["content:encoded"] || entry.content || "",
      preview: entry.contentSnippet?.slice(0, 120) + "...",
      image,
      source,
      is_creator: source === "Creators",
      has_og: !!image
    });
  }
}

items.sort((a, b) => b.date - a.date);
fs.writeFileSync("panel_cache.json", JSON.stringify(items, null, 2));
