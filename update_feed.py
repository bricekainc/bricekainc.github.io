import os
import feedparser
from datetime import datetime
import xml.etree.ElementTree as ET
from email.utils import formatdate

def main():
    output_dir = "patreon"
    output_file = os.path.join(output_dir, "rss.xml")
    os.makedirs(output_dir, exist_ok=True)

    # Get comma-separated list of Patreon RSS URLs from GitHub Secret
    rss_urls_env = os.environ.get("PATREON_RSS_URLS", "")
    if not rss_urls_env:
        raise ValueError("PATREON_RSS_URLS secret is not set.")
    
    urls = [url.strip() for url in rss_urls_env.split(",") if url.strip()]
    all_items = []

    for url in urls:
        print(f"Fetching RSS from: {url}")
        feed = feedparser.parse(url)
        creator_name = feed.feed.get("title", "Patreon Creator")
        
        for entry in feed.entries:
            # Parse publication date
            pub_date = entry.get("published_parsed") or entry.get("updated_parsed")
            if pub_date:
                dt = datetime(*pub_date[:6])
                timestamp = dt.timestamp()
                formatted_date = formatdate(timestamp, localtime=True)
            else:
                timestamp = 0
                formatted_date = formatdate(localtime=True)

            title = entry.get("title", "Untitled Post")
            link = entry.get("link", "")
            summary = entry.get("summary", entry.get("description", ""))
            
            # Create a stylized button for private/sub-to-view posts
            button_html = f'<p><a href="{link}" target="_blank" style="display: inline-block; padding: 10px 15px; background-color: #FF424D; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold;">View on Patreon (Sub to View)</a></p>'
            description_html = f"<![CDATA[<div>{summary}<br/><br/>{button_html}</div>]]>"

            all_items.append({
                "title": f"[{creator_name}] {title}",
                "link": link,
                "pubDate": formatted_date,
                "timestamp": timestamp,
                "description": f"<div>{summary}<br/><br/>{button_html}</div>"
            })

    # Sort items by timestamp descending (newest posts first)
    all_items.sort(key=lambda x: x['timestamp'], reverse=True)

    # Build standard RSS 2.0 XML tree
    rss_root = ET.Element("rss", version="2.0")
    channel = ET.SubElement(rss_root, "channel")
    
    ET.SubElement(channel, "title").text = "Patreon Feed"
    ET.SubElement(channel, "link").text = "https://bricekainc.github.io/patreon/rss.xml"
    ET.SubElement(channel, "description").text = "Aggregated private Patreon posts."
    ET.SubElement(channel, "lastBuildDate").text = formatdate(localtime=True)

    for item_data in all_items:
        item = ET.SubElement(channel, "item")
        ET.SubElement(item, "title").text = item_data["title"]
        ET.SubElement(item, "link").text = item_data["link"]
        ET.SubElement(item, "pubDate").text = item_data["pubDate"]
        
        desc = ET.SubElement(item, "description")
        desc.text = item_data["description"]

    # Convert to string and handle ElementTree CDATA escape quirk
    xml_string = ET.tostring(rss_root, encoding="utf-8", xml_declaration=True).decode("utf-8")
    xml_string = xml_string.replace("&lt;![CDATA[", "<![CDATA[").replace("]]&gt;", "]]>")

    with open(output_file, "w", encoding="utf-8") as f:
        f.write(xml_string)

    print(f"Successfully generated combined feed at {output_file} with {len(all_items)} total posts.")

if __name__ == "__main__":
    main()
