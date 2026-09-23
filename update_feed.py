import os
import requests
import xml.etree.ElementTree as ET

def indent(elem, level=0):
    i = "\n" + level * "  "
    if len(elem):
        if not elem.text or not elem.text.strip():
            elem.text = i + "  "
        for e in elem:
            indent(e, level + 1)
        if not elem.tail or not elem.tail.strip():
            elem.tail = i
    else:
        if not elem.tail or not elem.tail.strip():
            elem.tail = i

def main():
    FEED_FILE = "feed.xml"
    rss_url = os.environ.get("PATREON_RSS_URL")
    
    if not rss_url:
        raise ValueError("PATREON_RSS_URL secret is not set.")

    print("Fetching direct Patreon RSS feed...")
    response = requests.get(rss_url)
    response.raise_for_status()

    # Parse and pretty-print the XML for your website
    root = ET.fromstring(response.content)
    indent(root)
    
    tree = ET.ElementTree(root)
    tree.write(FEED_FILE, encoding='utf-8', xml_declaration=True)
    
    print(f"Successfully updated {FEED_FILE}")

if __name__ == "__main__":
    main()
