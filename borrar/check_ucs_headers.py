import re
import os

xml_path = r'c:/Users/SANTIAGO/Desktop/projects/hydrosyn/borrar/temp_odt_original/content.xml'
with open(xml_path, 'r', encoding='utf-8') as f:
    content = f.read()

body = content.split('<office:body>')[1]
headers = re.findall(r'<text:h[^>]*>.*?</text:h>', body)

for i, h in enumerate(headers):
    clean = re.sub(r'<[^>]+>', '', h)
    level_match = re.search(r'outline-level="(\d+)"', h)
    level = level_match.group(1) if level_match else 'N/A'
    print(f"Header {i} (Level {level}): {clean[:100]}")
