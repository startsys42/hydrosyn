
#!/bin/bash
COLOR_BG_IMPAR="46"
COLOR_BG_PAR="43"


# Actualizar los repositorios y paquetes del sistema
echo "Actualizando el sistema..."
apt update -y
apt upgrade -y

# Instalar OpenSSH Server y OpenSSH Client
echo "Instalando OpenSSH Server y Client..."
apt install -y openssh-server openssh-client

# Configurar el servicio SSH para que arranque automáticamente
echo "Habilitando SSH para que se inicie en el arranque..."
systemctl enable ssh

# Arrancar el servicio SSH (si no está en ejecución)
echo "Iniciando el servicio SSH..."
systemctl start ssh

# Verificar que el servicio SSH esté corriendo
echo "Verificando el estado del servicio SSH..."
systemctl status ssh

echo "¡SSH Server y Client instalados y configurados correctamente!"
