
#!/bin/bash
COLOR_BG_IMPAR="46"
COLOR_BG_PAR="43"



apt-get update -y > /dev/null
apt-get upgrade -y > /dev/null


ins-paq openssh-server 
ins-paq openssh-client


systemctl enable ssh


systemctl start ssh

# Verificar que el servicio SSH esté corriendo
echo "Verificando el estado del servicio SSH..."
systemctl status ssh

echo "¡SSH Server y Client instalados y configurados correctamente!"
# sshh audit ssh guard
