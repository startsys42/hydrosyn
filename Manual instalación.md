# Manual de instalación
Para la instalación del sistema de Hydrosyn se necesita ....

## Requisitos


## Segudidad extra

Se recomienda implementar en el servidor las siguientes medidas de seguridad, si se posee un servidor físico accesible:

- Protección de la BIOS/UEFI con contraseña
- Bloquear el arranque desde USBs o CDs en la BIOS
- Proteger el grub con contraseña
- Bloquear el montar USBs, CDs... en el sistema operativo
- Uso de particiones separadas
- Configuración de tecnología RAID
- si usas servidor dns propio, configura dnssec

Se recomienda implementar distintos usuarios y permisos para las distintas bases de datos si se tienen varias. Si solo se va a guardar esta, la lógica de permisos recae en la aplicación.
Se recomienda usar cifrado SSL/TLS si la base de datos va a permitir conexiones remotas y  estar en una ubicación distinta al servidor de la aplicación. Ajustar logs, caches, hilos y conexiones permitidas.


