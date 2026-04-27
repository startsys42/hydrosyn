import re
content = open(r'c:/Users/SANTIAGO/Desktop/projects/hydrosyn/borrar/temp_odt_extracted/content.xml', 'r', encoding='utf-8').read()
headers = re.findall(r'<text:h[^>]*outline-level="4"[^>]*>.*?</text:h>', content)
for h in headers:
    print(h)
