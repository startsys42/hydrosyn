#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para analizar el ODT y ver qué paquetes tienen explicación y cuáles no.
"""

import zipfile
import re

# Leer el content.xml del ODT
z = zipfile.ZipFile('Anexo II Especificación de requisitos software.odt')
content = z.read('content.xml').decode('utf-8')

# Buscar todos los elementos text:h de nivel 4 que contengan 5.2.3
pattern = r'<text:h[^>]*outline-level="4"[^>]*>.*?</text:h>'
matches = re.findall(pattern, content, re.DOTALL)

print(f"Encontrados {len(matches)} elementos h de nivel 4")
print("\n=== Títulos de sección 5.2.3 ===")

for m in matches:
    if '5.2.3' in m:
        # Extraer solo el texto visible
        text = re.sub(r'<[^>]+>', '', m)
        print(f"\n-> {text[:150]}")

# Ahora buscar el contexto alrededor de cada título de paquete de gestión
print("\n\n=== Análisis de paquetes de Gestión ===")

# Buscar secciones que empiecen con 5.2.3.X. Gestión
gestion_pattern = r'(5\.2\.3\.\d+\.\s*Gestión\s+de\s+\w+)'
gestion_matches = re.findall(gestion_pattern, content)
print(f"Paquetes de gestión encontrados: {len(gestion_matches)}")
for g in gestion_matches:
    print(f"  - {g}")

# Para cada paquete, buscar qué hay entre el título y la primera tabla
print("\n\n=== Estructura después de cada título de paquete ===")

# Buscar los títulos completos con su XML
for i in range(1, 9):
    # Patrón para encontrar el título del paquete
    pattern = rf'5\.2\.3\.{i}\..*?Gestión.*?</text:h>'
    match = re.search(pattern, content, re.DOTALL)
    if match:
        print(f"\n5.2.3.{i}: Título encontrado")
        # Obtener el contexto después del título (siguientes 500 caracteres)
        end_pos = match.end()
        contexto = content[end_pos:end_pos+500]
        # Ver si hay una tabla pronto
        if '<table:table' in contexto:
            tabla_pos = contexto.index('<table:table')
            entre_titulo_tabla = contexto[:tabla_pos]
            texto_entre = re.sub(r'<[^>]+>', '', entre_titulo_tabla).strip()
            if texto_entre:
                print(f"  -> Hay texto entre título y tabla: '{texto_entre[:100]}...'")
            else:
                print(f"  -> NO hay texto entre título y tabla (va directo a tabla)")
        else:
            print(f"  -> No se encuentra tabla en los siguientes 500 chars")
    else:
        print(f"\n5.2.3.{i}: NO se encontró título")