#!/usr/bin/env python3
"""
Briceka News Aggregator
Fetches RSS feeds, generates news.json, individual HTML pages, and sitemap.xml
"""

import json
import os
import re
import hashlib
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import URLError
from html.parser import HTMLParser
import xml.etree.ElementTree as ET

# ── Configuration ────────────────────────────────────────────────────────────

SITE_URL = "https://briceka.com"
BASE_DIR = Path(__file__).parent.parent  # repo root
DATA_DIR = BASE_DIR / "data"
NEWS_DIR = BASE_DIR / "news"            # individual article HTML pages
SITEMAP   = BASE_DIR / "sitemap.xml"

RSS_FEEDS = [
    {"name": "TechCrunch",           "url": "https://techcrunch.com/feed/"},
    {"name": "The Verge",            "url": "https://www.theverge.com/rss/index.xml"},
    {"name": "MIT Tech Review",      "url": "https://www.technologyreview.com/feed/"},
    {"name": "Hacker News (Top)",    "url": "https://hnrss.org/frontpage"},
    {"name": "Wired Innovation",     "url": "https://www.wired.com/feed/tag/innovation/rss"},
]

MAX_ARTICLES_PER_FEED = 10   # cap per feed
SUMMARY_MAX_CHARS     = 300  # truncate summaries

# ── Helpers ──────────────────────────────────────────────────────────────────

class MLStripper(HTMLParser):
    """Strip HTML tags from a string."""
    def __init__(self):
        super().__init__()
        self.reset()
        self.fed = []
    def handle_data(self, d):
        self.fed.append(d)
    def get_data(self):
        return " ".join(self.fed)

def strip_html(html: str) -> str:
    s = MLStripper()
    s.feed(html or "")
    text = s.get_data()
    return re.sub(r"\s+", " ", text).strip()

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    text = re.sub(r"^-+|-+$", "", text)
    return text[:80]          # keep URLs short

def unique_slug(slug: str, seen: set) -> str:
    base, n = slug, 1
    while slug in seen:
        slug = f"{base}-{n}"
        n += 1
    seen.add(slug)
    return slug

def article_id(link: str) -> str:
    return hashlib.md5(link.encode()).hexdigest()[:8]

def fetch_xml(url: str):
    req = Request(url, headers={"User-Agent": "Briceka-NewsBot/1.0"})
    with urlopen(req, timeout=15) as r:
        return ET.fromstring(r.read())

def parse_date(raw: str) -> str:
    """Return ISO-8601 date string, or today as fallback."""
    if not raw:
        return datetime.now(timezone.utc).strftime("%Y-%m-%d")
    for fmt in (
        "%a, %d %b %Y %H:%M:%S %z",
        "%a, %d %b %Y %H:%M:%S GMT",
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%SZ",
    ):
        try:
            return datetime.strptime(raw.strip(), fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return raw[:10]   # best-effort first 10 chars

# Namespace map for Atom feeds
NS = {
    "atom":    "http://www.w3.org/2005/Atom",
    "content": "http://purl.org/rss/1.0/modules/content/",
    "dc":      "http://purl.org/dc/elements/1.1/",
}

def extract_articles(root: ET.Element, source_name: str) -> list[dict]:
    articles = []

    # ── Atom feed ────────────────────────────────────────────────────────────
    if root.tag in ("{http://www.w3.org/2005/Atom}feed", "feed"):
        entries = root.findall("atom:entry", NS) or root.findall("entry")
        for entry in entries[:MAX_ARTICLES_PER_FEED]:
            title_el = entry.find("atom:title", NS) or entry.find("title")
            link_el  = entry.find("atom:link",  NS) or entry.find("link")
            date_el  = (entry.find("atom:updated",   NS) or entry.find("updated") or
                        entry.find("atom:published",  NS) or entry.find("published"))
            summ_el  = (entry.find("atom:summary",   NS) or entry.find("summary") or
                        entry.find("atom:content",   NS) or entry.find("content"))

            link = link_el.get("href", "") if link_el is not None else ""
            if not link:
                link = link_el.text or "" if link_el is not None else ""

            summary = strip_html(summ_el.text or "") if summ_el is not None else ""
            articles.append({
                "title":   (title_el.text or "").strip() if title_el is not None else "",
                "link":    link.strip(),
                "date":    parse_date(date_el.text if date_el is not None else ""),
                "summary": summary[:SUMMARY_MAX_CHARS],
                "source":  source_name,
            })
        return articles

    # ── RSS 2.0 feed ─────────────────────────────────────────────────────────
    channel = root.find("channel") or root
    for item in channel.findall("item")[:MAX_ARTICLES_PER_FEED]:
        title_el  = item.find("title")
        link_el   = item.find("link")
        date_el   = item.find("pubDate") or item.find("dc:date", NS)
        desc_el   = item.find("description")
        content_el = item.find("content:encoded", NS)

        raw_summary = (content_el.text or "") if content_el is not None else (desc_el.text or "") if desc_el is not None else ""
        summary = strip_html(raw_summary)[:SUMMARY_MAX_CHARS]

        articles.append({
            "title":   (title_el.text or "").strip() if title_el is not None else "",
            "link":    (link_el.text or "").strip()  if link_el  is not None else "",
            "date":    parse_date(date_el.text if date_el is not None else ""),
            "summary": summary,
            "source":  source_name,
        })
    return articles

# ── HTML template for individual article pages ───────────────────────────────

def article_html(article: dict) -> str:
    title   = article["title"].replace('"', "&quot;").replace("<", "&lt;")
    summary = article["summary"].replace("<", "&lt;")
    date    = article["date"]
    source  = article["source"]
    link    = article["link"]
    slug    = article["slug"]
    canonical = f"{SITE_URL}/news/{slug}/"

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title} | Briceka News</title>
  <meta name="description" content="{summary[:155]}">
  <link rel="canonical" href="{canonical}">

  <!-- Open Graph -->
  <meta property="og:title"       content="{title}">
  <meta property="og:description" content="{summary[:155]}">
  <meta property="og:url"         content="{canonical}">
  <meta property="og:type"        content="article">
  <meta property="og:site_name"   content="Briceka">

  <!-- Twitter Card -->
  <meta name="twitter:card"        content="summary">
  <meta name="twitter:title"       content="{title}">
  <meta name="twitter:description" content="{summary[:155]}">

  <!-- JSON-LD structured data -->
  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": "{title}",
    "datePublished": "{date}",
    "description": "{summary[:155]}",
    "url": "{canonical}",
    "publisher": {{
      "@type": "Organization",
      "name": "Briceka",
      "url": "{SITE_URL}"
    }}
  }}
  </script>

  <style>
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{ font-family: system-ui, sans-serif; background: #f9f9f9; color: #1a1a1a; line-height: 1.6; }}
    .container {{ max-width: 720px; margin: 0 auto; padding: 2rem 1rem; }}
    .breadcrumb {{ font-size: .85rem; color: #666; margin-bottom: 1.5rem; }}
    .breadcrumb a {{ color: #555; text-decoration: none; }}
    .breadcrumb a:hover {{ text-decoration: underline; }}
    h1 {{ font-size: 1.75rem; line-height: 1.3; margin-bottom: .75rem; }}
    .meta {{ font-size: .85rem; color: #666; margin-bottom: 1.5rem; }}
    .meta span {{ margin-right: 1rem; }}
    .summary {{ background: #fff; border-left: 4px solid #0066cc; padding: 1rem 1.25rem; border-radius: 0 6px 6px 0; margin-bottom: 2rem; }}
    .cta {{ display: inline-block; background: #0066cc; color: #fff; padding: .65rem 1.5rem; border-radius: 6px; text-decoration: none; font-weight: 600; }}
    .cta:hover {{ background: #0052a3; }}
    .back {{ display: block; margin-top: 2rem; font-size: .9rem; color: #555; text-decoration: none; }}
    .back:hover {{ text-decoration: underline; }}
  </style>
</head>
<body>
  <div class="container">
    <p class="breadcrumb"><a href="{SITE_URL}">Briceka</a> › <a href="{SITE_URL}/news.html">News</a> › {source}</p>
    <h1>{title}</h1>
    <div class="meta">
      <span>📅 {date}</span>
      <span>📰 {source}</span>
    </div>
    <div class="summary"><p>{summary}</p></div>
    <a class="cta" href="{link}" target="_blank" rel="noopener">Read full article →</a>
    <a class="back" href="{SITE_URL}/news.html">← Back to all news</a>
  </div>
</body>
</html>
"""

# ── Sitemap ───────────────────────────────────────────────────────────────────

def write_sitemap(articles: list[dict]):
    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
             f'  <url><loc>{SITE_URL}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>',
             f'  <url><loc>{SITE_URL}/news.html</loc><changefreq>hourly</changefreq><priority>0.9</priority></url>']
    for a in articles:
        lines.append(
            f'  <url><loc>{SITE_URL}/news/{a["slug"]}/</loc>'
            f'<lastmod>{a["date"]}</lastmod>'
            f'<changefreq>monthly</changefreq>'
            f'<priority>0.7</priority></url>'
        )
    lines.append('</urlset>')
    SITEMAP.write_text("\n".join(lines), encoding="utf-8")
    print(f"  ✓ sitemap.xml ({len(articles)} article URLs)")

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print(f"\n{'='*50}")
    print(f"  Briceka News Aggregator — {datetime.now().strftime('%Y-%m-%d %H:%M UTC')}")
    print(f"{'='*50}\n")

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    NEWS_DIR.mkdir(parents=True, exist_ok=True)

    all_articles: list[dict] = []
    seen_slugs: set = set()
    seen_ids:   set = set()

    for feed in RSS_FEEDS:
        print(f"Fetching: {feed['name']}")
        try:
            root = fetch_xml(feed["url"])
            articles = extract_articles(root, feed["name"])
            print(f"  → {len(articles)} articles found")
            for a in articles:
                if not a["title"] or not a["link"]:
                    continue
                aid = article_id(a["link"])
                if aid in seen_ids:
                    continue
                seen_ids.add(aid)
                a["id"]   = aid
                a["slug"] = unique_slug(slugify(a["title"]), seen_slugs)
                all_articles.append(a)
        except URLError as e:
            print(f"  ✗ Network error: {e}")
        except ET.ParseError as e:
            print(f"  ✗ XML parse error: {e}")
        except Exception as e:
            print(f"  ✗ Unexpected error: {e}")

    # Sort newest first
    all_articles.sort(key=lambda x: x["date"], reverse=True)

    # Save news.json
    json_path = DATA_DIR / "news.json"
    meta = {
        "generated":     datetime.now(timezone.utc).isoformat(),
        "total":         len(all_articles),
        "articles":      all_articles,
    }
    json_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n✓ data/news.json saved ({len(all_articles)} articles)")

    # Generate individual HTML pages
    for a in all_articles:
        page_dir = NEWS_DIR / a["slug"]
        page_dir.mkdir(parents=True, exist_ok=True)
        (page_dir / "index.html").write_text(article_html(a), encoding="utf-8")
    print(f"✓ {len(all_articles)} article pages written to /news/")

    # Generate sitemap
    write_sitemap(all_articles)

    print(f"\n{'='*50}")
    print(f"  Done. {len(all_articles)} articles processed.")
    print(f"{'='*50}\n")

if __name__ == "__main__":
    main()
