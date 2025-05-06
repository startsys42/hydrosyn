#!/bin/bash
set -e  # Salir si hay error
CONFIG_FILE="config.env"
LIBRARY_FILE="funciones.sh"
BASHRC="/root/.bashrc"
MARKER="# === VARS_FROM_CONF_ENV ==="

# Leer configuración desde archivo

if [[ -f "$CONFIG_FILE" ]]; then
source "$CONFIG_FILE"
  if ! grep -q "$MARKER" "$BASHRC"; then
  {
    echo -e "\n$MARKER"
    cat "$CONFIG_FILE"
    echo "# === END_VARS_FROM_CONF_ENV ==="
  } >> "$BASHRC"
  echo "Variables añadidas a $BASHRC"
else
  echo "Las variables ya están presentes en $BASHRC"
fi
else
 echo -e "\e[30;41mArchivo de configuración $CONFIG_FILE no encontrado.\e[0m"
  exit 1
fi

# Leer script funciones

if [[ -f "$LIBRARY_FILE" ]]; then
  source "$LIBRARY_FILE"
else
 echo -e "\e[30;41mArchivo de funciones $LIBRARY_FILE no encontrado.\e[0m"
  exit 1
fi

  

echo -e "\e[30;43mConfigurando idioma del sistema a $IDIOMA...\e[0m"
apt install locales
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
