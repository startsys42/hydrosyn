
#!/bin/bash
COLOR_BG_IMPAR="46"
COLOR_BG_PAR="43"


# Actualizar los repositorios y paquetes del sistema
echo "Actualizando el sistema..."
apt update -y
apt upgrade -y

instalar_paquete openssh-server 
instalar_paquete openssh-client


systemctl enable ssh


systemctl start ssh

# Verificar que el servicio SSH esté corriendo
echo "Verificando el estado del servicio SSH..."
systemctl status ssh

echo "¡SSH Server y Client instalados y configurados correctamente!"
# sshh audit ssh guard
