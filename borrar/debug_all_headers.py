import re
content = open(r'c:/Users/SANTIAGO/Desktop/projects/hydrosyn/borrar/temp_odt_extracted/content.xml', 'r', encoding='utf-8').read()
headers = re.findall(r'<text:h[^>]*>.*?</text:h>', content)
for h in headers:
    clean = re.sub(r'<[^>]+>', '', h)
    if "5.2.3." in clean:
        print(f"Level: {re.search(r'outline-level=\"(\d+)\"', h).group(1) if re.search(r'outline-level=\"(\d+)\"', h) else 'N/A'}, Text: {clean}")
