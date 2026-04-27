import zipfile
import re
import os

odt_path = r'c:/Users/SANTIAGO/Desktop/projects/hydrosyn/borrar/Anexo II Especificación de requisitos software.odt'
temp_xml = r'c:/Users/SANTIAGO/Desktop/projects/hydrosyn/borrar/temp_odt_original/content.xml'
output_odt = r'c:/Users/SANTIAGO/Desktop/projects/hydrosyn/borrar/Anexo II Especificación de requisitos software_COMPLETO.odt'

# 1. Definir los Requisitos No Funcionales (RNFs)
rnfs = [
    ("RNF-001", "Disponibilidad", "El sistema deberá estar disponible durante el horario de riego y monitorización (24/7)."),
    ("RNF-002", "Seguridad", "El sistema deberá proteger los datos de los usuarios mediante el uso de contraseñas seguras y cifrado en tránsito (HTTPS)."),
    ("RNF-003", "Usabilidad", "La interfaz de usuario deberá ser intuitiva, permitiendo a un usuario novel manejar las funciones básicas sin formación previa exhaustiva."),
    ("RNF-004", "Rendimiento", "Los tiempos de respuesta para las acciones de control (encendido de bombas, luces) deberán ser inferiores a 2 segundos en condiciones normales de red."),
    ("RNF-005", "Mantenibilidad", "El código fuente deberá seguir las guías de estilo de los lenguajes utilizados y estar estructurado para facilitar futuras ampliaciones."),
    ("RNF-006", "Portabilidad", "El cliente web del sistema deberá ser accesible desde los navegadores más utilizados (Chrome, Firefox, Safari, Edge)."),
    ("RNF-007", "Robustez", "El sistema deberá ser capaz de recuperarse ante fallos de conexión temporales con los dispositivos ESP32 sin perder la coherencia de los datos.")
]

# 2. Definir la Matriz de Rastreabilidad
# Formato: (UC, Nombre, OBJ, IRQ)
ucs = [
    ("UC-001", "Iniciar Sesión", "OBJ-001", "IRQ-001"),
    ("UC-002", "Recuperar Contraseña", "OBJ-001", "IRQ-001"),
    ("UC-003", "Cerrar Sesión", "OBJ-001", "IRQ-001"),
    ("UC-004", "Cambiar Email", "OBJ-001", "IRQ-001"),
    ("UC-005", "Cambiar Contraseña", "OBJ-001", "IRQ-001"),
    ("UC-006", "Crear Propietario", "OBJ-001", "IRQ-001"),
    ("UC-007", "Activar/Desactivar Propietario", "OBJ-001", "IRQ-001"),
    ("UC-008", "Eliminar Propietario", "OBJ-001", "IRQ-001"),
    ("UC-009", "Ver Notificaciones Administrador", "OBJ-001", "IRQ-001"),
    ("UC-010", "Eliminar Notificaciones", "OBJ-001", "IRQ-001"),
    ("UC-011", "Ver Notificaciones Sistema", "OBJ-001", "IRQ-001"),
    ("UC-012", "Crear Usuario", "OBJ-001", "IRQ-001"),
    ("UC-013", "Activar/Desactivar Usuario", "OBJ-001", "IRQ-001"),
    ("UC-014", "Eliminar Usuario", "OBJ-001", "IRQ-001"),
    ("UC-015", "Asociar Usuario", "OBJ-001", "IRQ-001"),
    ("UC-016", "Crear Sistema", "OBJ-002", "IRQ-002"),
    ("UC-017", "Renombrar Sistema", "OBJ-002", "IRQ-002"),
    ("UC-018", "Cambiar Código Sistema", "OBJ-002", "IRQ-002"),
    ("UC-019", "Eliminar Sistema", "OBJ-002", "IRQ-002"),
    ("UC-020", "Crear ESP32", "OBJ-003", "IRQ-003"),
    ("UC-021", "Renombrar ESP32", "OBJ-003", "IRQ-003"),
    ("UC-022", "Eliminar ESP32", "OBJ-003", "IRQ-003"),
    ("UC-023", "Crear Tanque", "OBJ-004", "IRQ-004"),
    ("UC-024", "Renombrar Tanque", "OBJ-004", "IRQ-004"),
    ("UC-025", "Eliminar Tanque", "OBJ-004", "IRQ-004"),
    ("UC-026", "Crear Bomba", "OBJ-005", "IRQ-005"),
    ("UC-027", "Modificar Bomba", "OBJ-005", "IRQ-005"),
    ("UC-028", "Eliminar Bomba", "OBJ-005", "IRQ-005"),
    ("UC-029", "Calibrar Bomba", "OBJ-005", "IRQ-005"),
    ("UC-030", "Listar Calibraciones", "OBJ-005", "IRQ-005"),
    ("UC-031", "Eliminar Calibraciones", "OBJ-005", "IRQ-005"),
    ("UC-032", "Listar Ejecución Calibraciones", "OBJ-005", "IRQ-005"),
    ("UC-033", "Eliminar Ejecución Calibraciones", "OBJ-005", "IRQ-005"),
    ("UC-034", "Realizar Bombeo", "OBJ-005", "IRQ-005"),
    ("UC-035", "Listar Bombeos", "OBJ-005", "IRQ-005"),
    ("UC-036", "Eliminar Bombeo", "OBJ-005", "IRQ-005"),
    ("UC-037", "Crear Programación Bombas", "OBJ-005", "IRQ-005"),
    ("UC-038", "Listar Programación Bombas", "OBJ-005", "IRQ-005"),
    ("UC-039", "Actualizar Programación Bomba", "OBJ-005", "IRQ-005"),
    ("UC-040", "Eliminar Programación Bomba", "OBJ-005", "IRQ-005"),
    ("UC-041", "Ejecutar Programación Bombas", "OBJ-005", "IRQ-005"),
    ("UC-042", "Crear Luz", "OBJ-006", "IRQ-006"),
    ("UC-043", "Renombrar Luz", "OBJ-006", "IRQ-006"),
    ("UC-044", "Eliminar Luz", "OBJ-006", "IRQ-006"),
    ("UC-045", "Crear Programación Luz", "OBJ-006", "IRQ-006"),
    ("UC-046", "Listar Programación Luces", "OBJ-006", "IRQ-006"),
    ("UC-047", "Actualizar Programación Luces", "OBJ-006", "IRQ-006"),
    ("UC-048", "Eliminar Programación Luces", "OBJ-006", "IRQ-006"),
    ("UC-049", "Ejecutar Programación Luces", "OBJ-006", "IRQ-006"),
    ("UC-050", "Listar Historial Luces", "OBJ-006", "IRQ-006"),
    ("UC-051", "Eliminar Historial Luces", "OBJ-006", "IRQ-006"),
    ("UC-052", "Crear Registro", "OBJ-007", "IRQ-007"),
    ("UC-053", "Listar Registros", "OBJ-007", "IRQ-007"),
    ("UC-054", "Eliminar Registros", "OBJ-007", "IRQ-007"),
]

# 3. Leer el content.xml
with open(temp_xml, 'r', encoding='utf-8') as f:
    content = f.read()

# 4. Definir los textos faltantes para los paquetes (basado en secciones_faltantes.txt)
faltantes = {
    "ESP32": "El paquete de Gestión de ESP32 se encarga de administrar los dispositivos microcontroladores que forman la base del sistema Hydrosyn. Los ESP32 son los nodos inteligentes que se conectan directamente con los sensores y actuadores del sistema de riego, actuando como intermediarios entre el mundo físico y la plataforma central.\n\nEste módulo permite dar de alta nuevos dispositivos ESP32 en el sistema, configurar sus parámetros de comunicación, actualizar su firmware y monitorizar su estado operativo. Cada ESP32 puede gestionar múltiples sensores (humedad, temperatura, nivel de agua) y actuadores (bombas, válvulas, luces).\n\nLa gestión adecuada de estos dispositivos es crucial para garantizar la fiabilidad del sistema, ya que son responsables de ejecutar las programaciones de riego y recopilar datos en tiempo real de las condiciones ambientales y del sistema.",
    "Tanques": "El paquete de Gestión de Tanques permite administrar los depósitos de agua que forman parte del sistema de riego Hydrosyn. Estos tanques pueden ser de diferentes capacidades y tipos (almacenamiento principal, tanques de reserva, depósitos de fertilizantes, etc.), constituyendo la infraestructura básica para el suministro de recursos.\n\nEste módulo facilita el control de los niveles de agua, la gestión de llenado y vaciado, y el mantenimiento de los tanques. Permite configurar alarmas por niveles bajos, programar llenados automáticos y llevar un registro histórico del consumo y los niveles.\n\nLa gestión eficiente de los tanques es fundamental para garantizar un suministro continuo de agua para el riego, optimizar el uso de recursos y prevenir situaciones de escasez que podrían afectar negativamente a los cultivos.",
    "Bombas": "El paquete de Gestión de Bombas administra los dispositivos de bombeo que son el corazón del sistema de riego Hydrosyn. Estas bombas son responsables de mover el agua desde los tanques de almacenamiento hasta los diferentes puntos de riego, garantizando un suministro constante y eficiente para los cultivos.\n\nEste módulo permite controlar la operación de las bombas, programar su funcionamiento, realizar mantenimientos preventivos y calibrar su rendimiento. Incluye funcionalidades para monitorizar el estado operativo, detectar fallos y optimizar el consumo energético.\n\nLa gestión adecuada de las bombas es esencial para garantizar un riego eficiente, prevenir daños por operación incorrecta y mantener la fiabilidad del sistema. Las bombas pueden operar manualmente o de forma automática según las programaciones establecidas, adaptándose a las necesidades específicas de cada zona de cultivo.",
    "Luces": "El paquete de Gestión de Luces permite administrar los sistemas de iluminación artificial que complementan el sistema de riego Hydrosyn. Estas luces son especialmente importantes en invernaderos o cultivos bajo techo donde se necesita controlar el fotoperíodo y la intensidad lumínica para optimizar el crecimiento de las plantas.\n\nEste módulo facilita la programación de los ciclos de iluminación, el control de la intensidad, la gestión de diferentes tipos de luces (crecimiento, floración) y el mantenimiento histórico de su funcionamiento. Permite optimizar el consumo energético y coordinar la iluminación con los ciclos de riego.\n\nLa gestión inteligente de las luces contribuye a optimizar el crecimiento de las plantas, mejorar los rendimientos de los cultivos y reducir los costos operativos mediante programaciones automatizadas basadas en las necesidades específicas de cada tipo de cultivo.",
    "Registros": "El paquete de Gestión de Registros se encarga de administrar toda la información histórica generada por el sistema Hydrosyn. Esto incluye datos de sensores, operaciones de riego, eventos del sistema, mantenimientos realizados y cualquier otra información relevante para el análisis y la toma de decisiones.\n\nEste módulo permite consultar, analizar y gestionar grandes volúmenes de datos históricos, facilitando el seguimiento del rendimiento del sistema, la detección de tendencias y la optimización de las operaciones. Incluye herramientas para filtrado, exportación de datos y generación de informes.\n\nLa gestión adecuada de los registros es fundamental para el análisis predictivo, la auditoría de operaciones, el cumplimiento normativo y la mejora continua del sistema de riego inteligente."
}

# 5. Insertar textos en las secciones correspondientes
headers = re.findall(r'<text:h[^>]*outline-level="4"[^>]*>.*?</text:h>', content)
print(f"Total headers level 4: {len(headers)}")
for h_xml in headers:
    # Limpiar el XML para obtener el texto plano
    clean_h = re.sub(r'<[^>]+>', '', h_xml)
    print(f"Clean header: {clean_h}")
    for key, text in faltantes.items():
        # Match flexible: "Gestión de ESP32" or "5.2.3.4. Gestión de ESP32"
        if key.lower() in clean_h.lower():
            # Convertimos el texto a formato XML ODT (párrafos)
            paragraphs = text.split('\n\n')
            xml_text = ""
            for p in paragraphs:
                xml_text += f'<text:p text:style-name="P514">{p}</text:p>'
            # Insertamos después del encabezado
            content = content.replace(h_xml, h_xml + xml_text)
            print(f"Texto insertado en sección {key}.")
            break

# 6. Generar el XML de los RNFs (Sección 5.3)
rnf_xml = ''
for code, name, desc in rnfs:
    rnf_xml += f'<text:p text:style-name="P514"><text:span text:style-name="T1">{code} {name}:</text:span> {desc}</text:p>'

# 7. Generar el XML de la Matriz (Sección 6)
matrix_xml = '<text:p text:style-name="P514">A continuación se presenta la matriz de rastreabilidad que relaciona los casos de uso con los objetivos del sistema y los requisitos de información.</text:p>'
matrix_xml += '<table:table table:name="MatrizRastreabilidad">'
matrix_xml += '<table:table-column table:number-columns-repeated="4"/>'
# Cabecera
matrix_xml += '<table:table-row>'
for h in ["Caso de Uso", "Nombre", "Objetivo", "Req. Info"]:
    matrix_xml += f'<table:table-cell office:value-type="string"><text:p text:style-name="P514"><text:span text:style-name="T1">{h}</text:span></text:p></table:table-cell>'
matrix_xml += '</table:table-row>'
# Filas
for uc_code, uc_name, obj, irq in ucs:
    matrix_xml += f'<table:table-row>'
    matrix_xml += f'<table:table-cell office:value-type="string"><text:p text:style-name="P514">{uc_code}</text:p></table:table-cell>'
    matrix_xml += f'<table:table-cell office:value-type="string"><text:p text:style-name="P514">{uc_name}</text:p></table:table-cell>'
    matrix_xml += f'<table:table-cell office:value-type="string"><text:p text:style-name="P514">{obj}</text:p></table:table-cell>'
    matrix_xml += f'<table:table-cell office:value-type="string"><text:p text:style-name="P514">{irq}</text:p></table:table-cell>'
    matrix_xml += f'</table:table-row>'
matrix_xml += '</table:table>'

# 8. Insertar en el contenido
# Reemplazar el encabezado de RNF para incluir su contenido
rnf_header_pattern = r'(<text:h[^>]*outline-level="2"[^>]*>.*?5\.3\.\s*Requisitos No Funcionales.*?</text:h>)'
content = re.sub(rnf_header_pattern, r'\1' + rnf_xml, content)

# Reemplazar el encabezado de Matriz para incluir su contenido
matrix_header_pattern = r'(<text:h[^>]*outline-level="1"[^>]*>.*?6\.\s*Matriz de Rastreabilidad.*?</text:h>)'
content = re.sub(matrix_header_pattern, r'\1' + matrix_xml, content)

print("Secciones insertadas con éxito.")

# 7. Guardar el content.xml modificado
with open(temp_xml, 'w', encoding='utf-8') as f:
    f.write(content)

# 8. Re-empaquetar el ODT
with zipfile.ZipFile(odt_path, 'r') as zin:
    with zipfile.ZipFile(output_odt, 'w') as zout:
        for item in zin.infolist():
            if item.filename == 'content.xml':
                zout.write(temp_xml, 'content.xml')
            else:
                zout.writestr(item, zin.read(item.filename))

print(f"Archivo generado en: {output_odt}")
