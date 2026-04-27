#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para verificar qué paquetes tienen ALGÚN TIPO de explicación (no necesariamente la del archivo).
"""

import zipfile
import re

# Leer el content.xml del ODT
z = zipfile.ZipFile('Anexo II Especificación de requisitos software.odt')
content = z.read('content.xml').decode('utf-8')

# Buscar cada sección de paquete y ver si hay texto entre el título y las tablas
paquetes = [
    ('Autenticación', r'Gestión de Autenticación'),
    ('Usuarios', r'Gestión de Usuarios'),
    ('Sistemas', r'Gestión de Sistemas'),
    ('ESP32', r'Gestión de ESP32'),
    ('Tanques', r'Gestión de Tanques'),
    ('Bombas', r'Gestión de Bombas'),
    ('Luces', r'Gestión de Luces'),
    ('Registros', r'Gestión de Registros'),
]

print("=== Verificando explicaciones existentes en cada paquete ===\n")

for nombre, patron in paquetes:
    # Buscar el título del paquete
    match = re.search(patron, content)
    if match:
        idx = match.start()
        # Obtener el contexto (500 caracteres después del título)
        contexto = content[idx:idx+500]
        
        # Ver si hay texto descriptivo (no solo tablas)
        # Si hay <text:p> con texto antes de la primera <table:table>
        texto_entre = ''
        if '<table:table' in contexto:
            tabla_idx = contexto.index('<table:table')
            texto_entre = contexto[:tabla_idx]
        else:
            texto_entre = contexto
        
        # Extraer solo el texto visible
        texto_visible = re.sub(r'<[^>]+>', '', texto_entre).replace('\n', ' ').strip()
        
        # Filtrar solo el texto relevante (no números de página, índices, etc.)
        if len(texto_visible) > 50:
            print(f"PAQUETE {nombre}: TIENE explicación")
            print(f"  Texto: {texto_visible[:150]}...")
        else:
            print(f"PAQUETE {nombre}: NO TIENE explicación significativa")
            if texto_visible:
                print(f"  (solo hay: '{texto_visible[:50]}...')")
    else:
        print(f"PAQUETE {nombre}: NO ENCONTRADO")
    print()