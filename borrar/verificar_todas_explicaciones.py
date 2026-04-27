#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para verificar qué paquetes tienen explicación buscando frases específicas.
"""

import zipfile
import re

# Leer el content.xml del ODT
z = zipfile.ZipFile('Anexo II Especificación de requisitos software.odt')
content = z.read('content.xml').decode('utf-8')

# Frases características de las explicaciones del archivo explicaciones_paquetes.txt
frases_por_paquete = {
    'Autenticación': 'El paquete de Gestión de Autenticación es fundamental para garantizar',
    'Usuarios': 'El paquete de Gestión de Usuarios permite administrar las cuentas',
    'Sistemas': 'El paquete de Gestión de Sistemas permite administrar múltiples instalaciones',
    'ESP32': 'El paquete de Gestión de ESP32 se encarga de administrar los dispositivos microcontroladores',
    'Tanques': 'El paquete de Gestión de Tanques permite administrar los depósitos de agua',
    'Bombas': 'El paquete de Gestión de Bombas administra los dispositivos de bombeo',
    'Luces': 'El paquete de Gestión de Luces permite administrar los sistemas de iluminación',
    'Registros': 'El paquete de Gestión de Registros se encarga de administrar toda la información histórica',
}

print("=== Verificando si existen las explicaciones del archivo ===\n")

paquetes_con_explicacion = []
paquetes_sin_explicacion = []

for nombre, frase in frases_por_paquete.items():
    if frase in content:
        print(f"PAQUETE {nombre}: YA TIENE la explicación completa")
        paquetes_con_explicacion.append(nombre)
    else:
        print(f"PAQUETE {nombre}: NO TIENE la explicación (FALTA)")
        paquetes_sin_explicacion.append(nombre)

print(f"\n=== RESUMEN ===")
print(f"Paquetes CON explicación: {len(paquetes_con_explicacion)}")
for p in paquetes_con_explicacion:
    print(f"  - {p}")
print(f"\nPaquetes SIN explicación: {len(paquetes_sin_explicacion)}")
for p in paquetes_sin_explicacion:
    print(f"  - {p}")