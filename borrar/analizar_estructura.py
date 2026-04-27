#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para analizar la estructura del ODT y ver qué paquetes tienen explicación.
"""

import zipfile
import re

# Leer el content.xml del ODT
z = zipfile.ZipFile('Anexo II Especificación de requisitos software.odt')
content = z.read('content.xml').decode('utf-8')

# Buscar todas las ocurrencias de "Gestión de" en el contenido
print("=== Buscando todas las ocurrencias de 'Gestión de' ===\n")

# Encontrar posiciones de cada "Gestión de"
for match in re.finditer('Gestión de', content):
    start = max(0, match.start() - 100)
    end = min(len(content), match.end() + 200)
    contexto = content[start:end]
    # Limpiar para ver el texto
    texto = re.sub(r'<[^>]+>', '', contexto).replace('\n', ' ')
    print(f"Posición {match.start()}: ...{texto}...")
    print("---")

print("\n\n=== Buscando títulos de paquetes (5.2.3.X) ===\n")

# Buscar los títulos de los paquetes
for i in range(1, 9):
    # Buscar el patrón del título
    pattern = rf'5\.2\.3\.{i}\.[^<]*Gestión'
    matches = list(re.finditer(pattern, content))
    print(f"5.2.3.{i}: {len(matches)} ocurrencias")
    for m in matches[:2]:
        start = max(0, m.start() - 50)
        end = min(len(content), m.end() + 100)
        contexto = content[start:end]
        texto = re.sub(r'<[^>]+>', '', contexto).replace('\n', ' ')
        print(f"  -> ...{texto}...")