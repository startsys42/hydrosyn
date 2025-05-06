#!/bin/bash
set -e  # Salir si hay error

# Leer configuración desde archivo
CONFIG_FILE="config.env"
if [[ -f "$CONFIG_FILE" ]]; then
  source "$CONFIG_FILE"
else
  echo "Archivo de configuración $CONFIG_FILE no encontrado."
  exit 1
fi

echo "Configurando idioma del sistema a $IDIOMA..."
locale-gen "$IDIOMA"
update-locale LANG="$IDIOMA"

echo "Estableciendo zona horaria a $ZONA_HORARIA..."
timedatectl set-timezone "$ZONA_HORARIA"

echo "Activando sincronización automática de hora con NTP..."
timedatectl set-ntp true

echo "Configuración aplicada:"
timedatectl
locale | grep LANG



REPO_FILE="/etc/apt/sources.list"

# Respaldar el archivo actual de repositorios
echo "Creando una copia de seguridad del archivo de repositorios..."
cp $REPO_FILE $REPO_FILE.bak

# Configuración de los repositorios de Debian 12
echo "Configurando los repositorios para Debian 12 (Bullseye)..."

cat <<EOL > $REPO_FILE
# Repositorios principales para Debian 12 (Bullseye)
deb http://deb.debian.org/debian/ bookworm main contrib non-free
deb-src http://deb.debian.org/debian/ bookworm main contrib non-free

# Repositorios de seguridad
deb http://security.debian.org/debian-security/ bookworm-security main contrib non-free
deb-src http://security.debian.org/debian-security/ bookworm-security main contrib non-free

# Repositorios de actualizaciones
deb http://deb.debian.org/debian/ bookworm-updates main contrib non-free
deb-src http://deb.debian.org/debian/ bookworm-updates main contrib non-free
EOL

# Actualizar la lista de paquetes
echo "Actualizando la lista de paquetes..."
apt update

## nombre

## info ocultar

## repositorios

## red

## usuarios

## permisos

## instalar

## seguridad


## actualizaciones
