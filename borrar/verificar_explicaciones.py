#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para verificar qué paquetes tienen explicación y cuáles no.
"""

import zipfile
import re

# Leer el content.xml del ODT
z = zipfile.ZipFile('Anexo II Especificación de requisitos software.odt')
content = z.read('content.xml').decode('utf-8')

# Buscar cada sección de paquete y ver qué hay después del título
paquetes = [
    ('5.2.3.1', 'Gestión de Autenticación'),
    ('5.2.3.2', 'Gestión de Usuarios'),
    ('5.2.3.3', 'Gestión de Sistemas'),
    ('5.2.3.4', 'Gestión de ESP32'),
    ('5.2.3.5', 'Gestión de Tanques'),
    ('5.2.3.6', 'Gestión de Bombas'),
    ('5.2.3.7', 'Gestión de Luces'),
    ('5.2.3.8', 'Gestión de Registros'),
]

print("=== Verificando explicaciones por paquete ===\n")

for num, nombre in paquetes:
    # Buscar el título del paquete
    # Patrones posibles
    patrones = [
        rf'{num}\.{nombre}(<text:p|<table:table)',
        rf'{num}\..*?{nombre.split()[1]}(<text:p|<table:table)',
    ]
    
    encontrado = False
    for patron in patrones:
        match = re.search(patron, content)
        if match:
            encontrado = True
            siguiente_elemento = match.group(1)
            
            # Obtener contexto después del título
            start = match.start()
            contexto = content[start:start+300]
            texto_contexto = re.sub(r'<[^>]+>', '', contexto).replace('\n', ' ').strip()
            
            print(f"{num} - {nombre}:")
            print(f"  Siguiente elemento: {siguiente_elemento}")
            print(f"  Contexto: {texto_contexto[:150]}...")
            
            if siguiente_elemento == '<table:table':
                print(f"  -> NO TIENE explicación (va directo a tabla)")
            elif siguiente_elemento == '<text:p':
                # Verificar si hay texto en el párrafo
                if len(texto_contexto) > 30:
                    print(f"  -> TIENE explicación")
                else:
                    print(f"  -> NO TIENE explicación (párrafo vacío)")
            print()
            break
    
    if not encontrado:
        print(f"{num} - {nombre}: NO ENCONTRADO")
        print()