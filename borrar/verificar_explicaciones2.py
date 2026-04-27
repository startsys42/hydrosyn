#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para verificar qué paquetes tienen explicación y cuáles no.
Buscamos directamente las frases que indican explicación.
"""

import zipfile
import re

# Leer el content.xml del ODT
z = zipfile.ZipFile('Anexo II Especificación de requisitos software.odt')
content = z.read('content.xml').decode('utf-8')

# Buscar las explicaciones existentes por las frases características
explicaciones_busqueda = [
    ('Autenticación', r'5\.2\.3\.1.*?Gestión de Autenticación</text:h>(.*?)<table:table'),
    ('Usuarios', r'5\.2\.3\.2.*?Gestión de Usuarios</text:h>(.*?)<table:table'),
    ('Sistemas', r'5\.2\.3\.3.*?Gestión de Sistemas</text:h>(.*?)<table:table'),
    ('ESP32', r'5\.2\.3\.4.*?Gestión de ESP32</text:h>(.*?)<table:table'),
    ('Tanques', r'5\.2\.3\.5.*?Gestión de Tanques(</text:h>)?(.*?)<table:table'),
    ('Bombas', r'5\.2\.3\.6.*?Gestión de Bombas(</text:h>)?(.*?)<table:table'),
    ('Luces', r'5\.2\.3\.7.*?Gestión de Luces(</text:h>)?(.*?)<table:table'),
    ('Registros', r'5\.2\.3\.8.*?Gestión de Registros(</text:h>)?(.*?)<table:table'),
]

print("=== Verificando explicaciones por paquete ===\n")

for nombre, patron in explicaciones_busqueda:
    match = re.search(patron, content, re.DOTALL)
    if match:
        entre_titulo_tabla = match.group(match.lastindex) if match.lastindex else match.group(0)
        texto = re.sub(r'<[^>]+>', '', entre_titulo_tabla).replace('\n', ' ').strip()
        
        if texto and len(texto) > 20:
            print(f"PAQUETE {nombre}: TIENE explicación")
            print(f"  Texto: {text[:100]}...")
        else:
            print(f"PAQUETE {nombre}: NO TIENE explicación (vacío o muy corto)")
    else:
        print(f"PAQUETE {nombre}: NO ENCONTRADO con este patrón")
    print()

# También buscar las explicaciones que ya vimos en el análisis anterior
print("\n=== Buscando explicaciones existentes ===\n")

frases_explicacion = [
    "En este paquete se encuentran los casos de uso relacionados con",
    "Los propietarios pueden crear sistemas",
]

for frase in frases_explicacion:
    if frase in content:
        print(f"EXPLICACIÓN ENCONTRADA: '{frase[:50]}...'")
        # Encontrar el contexto
        idx = content.index(frase)
        contexto = content[max(0, idx-100):idx+200]
        texto = re.sub(r'<[^>]+>', '', contexto).replace('\n', ' ').strip()
        print(f"  Contexto: {texto[:150]}...")
    else:
        print(f"NO encontrada: '{frase[:50]}...'")
    print()