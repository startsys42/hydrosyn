#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para verificar explicaciones en el cuerpo del documento (no en el índice).
"""

import zipfile
import re

# Leer el content.xml del ODT
z = zipfile.ZipFile('Anexo II Especificación de requisitos software.odt')
content = z.read('content.xml').decode('utf-8')

# Buscar las secciones del cuerpo del documento (después del índice)
# El índice termina alrededor de la posición 1500000
# Las secciones principales empiezan después

# Buscar los títulos de nivel 4 en el cuerpo del documento
# Son los que tienen outline-level="4" y están después del índice
patron_titulo_nivel4 = r'<text:h[^>]*outline-level="4"[^>]*>(.*?)</text:h>'

matches = list(re.finditer(patron_titulo_nivel4, content, re.DOTALL))

print(f"Encontrados {len(matches)} títulos de nivel 4\n")

# Filtrar solo los que son de la sección 5.2.3
for match in matches:
    titulo_xml = match.group(1)
    titulo_texto = re.sub(r'<[^>]+>', '', titulo_xml).strip()
    
    # Solo mostrar los que son de la sección 5.2.3.X
    if re.search(r'5\.2\.3\.\d+', titulo_texto) or 'Gestión de' in titulo_texto:
        print(f"Título: {titulo_texto[:80]}")
        
        # Ver qué hay después de este título
        fin_titulo = match.end()
        siguiente_contexto = content[fin_titulo:fin_titulo+600]
        
        # Extraer texto entre título y primera tabla
        if '<table:table' in siguiente_contexto:
            tabla_idx = siguiente_contexto.index('<table:table')
            entre_texto = siguiente_contexto[:tabla_idx]
        else:
            entre_texto = siguiente_contexto
        
        texto_visible = re.sub(r'<[^>]+>', '', entre_texto).replace('\n', ' ').strip()
        
        if len(texto_visible) > 30:
            print(f"  -> TIENE texto: {text[:100]}...")
        else:
            print(f"  -> NO TIENE texto significativo")
        print()