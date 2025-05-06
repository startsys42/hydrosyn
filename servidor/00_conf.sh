#!/bin/bash
set -e  # Salir si hay error

# Leer configuración desde archivo
CONFIG_FILE="config.env"
if [[ -f "$CONFIG_FILE" ]]; then
  source "$CONFIG_FILE"
else
 echo -e "\e[30;41mArchivo de configuración $CONFIG_FILE no encontrado.\e[0m"
  exit 1
fi

echo -e "\e[30;43mConfigurando idioma del sistema a $IDIOMA...\e[0m"
locale-gen "$IDIOMA"
update-locale LANG="$IDIOMA"

echo -e "\e[46mEstableciendo zona horaria a $ZONA_HORARIA...\e[0m"
timedatectl set-timezone "$ZONA_HORARIA"

echo "Activando sincronización automática de hora con NTP..."
timedatectl set-ntp true

echo "Configuración aplicada:"
timedatectl
locale | grep LANG


echo "Configurando los repositorios de APT en $REPO_FILE..."

cat <<EOF > $REPO_FILE
# Repositorios principales para Debian 12 (Bookworm)
deb http://deb.debian.org/debian/ bookworm main contrib non-free
deb-src http://deb.debian.org/debian/ bookworm main contrib non-free

# Repositorios de seguridad
deb http://security.debian.org/debian-security/ bookworm-security main contrib non-free
deb-src http://security.debian.org/debian-security/ bookworm-security main contrib non-free

# Repositorios de actualizaciones
deb http://deb.debian.org/debian/ bookworm-updates main contrib non-free
deb-src http://deb.debian.org/debian/ bookworm-updates main contrib non-free
EOF

# Actualizar la lista de paquetes
echo "Actualizando la lista de paquetes..."
apt update
apt upgrade

echo "Configuración aplicada exitosamente."


## nombre

## info ocultar

## repositorios

## red

## usuarios

## permisos

## instalar

## seguridad


## actualizaciones
