#!/bin/bash
set -e  # Salir si hay error
CONFIG_FILE="config.env"
#LIBRARY_FILE="funciones.sh"
#BASHRC="/root/.bashrc"
COLOR_BG_IMPAR="46"
COLOR_BG_PAR="43"
export MARKER_INI="# === VARS_FROM_CONF_ENV ==="
export MARKER_END="# === END_VARS_FROM_CONF_ENV ==="
# Leer configuración desde archivo

if [[ -f "$CONFIG_FILE" ]]; then
source "$CONFIG_FILE"
  if ! grep -q "$MARKER_INI" "$BASHRC"; then
  {
    echo -e "\n$MARKER_INI" && cat "$CONFIG_FILE" 
  } >> "$BASHRC"
  
 echo -e "\e[30;${COLOR_BG_IMPAR}mVariables añadidas a $BASHRC\e[0m"
else
echo -e "\e[30;${COLOR_BG_IMPAR}mLas variables ya están presentes en $BASHRC\e[0m"
fi
source "$BASHRC"
else
 echo -e "\e[30;41mArchivo de configuración $CONFIG_FILE no encontrado.\e[0m"
  exit 1
fi

# Leer script funciones

if [[ -f "$FUNCIONES" ]]; then
  source "$FUNCIONES"
   if ! grep -q "$MARKER_END" "$BASHRC"; then
  
echo "if [ -f $FUNCIONES ]; then" >> "$BASHRC" && \
echo "    source $FUNCIONES" >> "$BASHRC" && \
echo 'fi' >> "$BASHRC" &&\
echo -e "\n$MARKER_END" >> "$BASHRC"
echo -e "\e[30;${COLOR_BG_PAR}mFunciones  añadidas a $BASHRC\e[0m"
else
echo -e "\e[30;${COLOR_BG_PAR}mLas funciones ya están presentes en $BASHRC\e[0m"
fi
source "$BASHRC"
else
 echo -e "\e[30;41mArchivo de funciones $FUNCIONES no encontrado.\e[0m"
  exit 1
fi


#Idioma y hora


instalar_paquete locales
locale-gen "$IDIOMA"
update-locale LANG="$IDIOMA"


# Verificar directamente si la configuración se realizó correctamente
if locale | grep -q "LANG=$IDIOMA"; then
    echo -e "\e[30;${COLOR_BG_IMPAR}mEl idioma se ha configurado correctamente a $IDIOMA.\e[0m"
else
    echo -e "\e[30;41mHubo un error al configurar el idioma.\e[0m"
    exit 1
fi



timedatectl set-timezone "$ZONA_HORARIA"

if timedatectl | grep -q "Time zone: $ZONA_HORARIA"; then
    echo -e "\e[30;${COLOR_BG_PAR}mLa zona horaria se ha configurado correctamente a $ZONA_HORARIA.\e[0m"
else
    echo -e "\e[30;41mHubo un error al configurar la zona horaria.\e[0m"
    exit 1
fi



timedatectl set-ntp true


if timedatectl | grep -q "NTP synchronized: yes"; then
    echo -e "\e[30;${COLOR_BG_IMPAR}mLa sincronización NTP está activada correctamente.\e[0m"
else
    echo -e "\e[30;41mHubo un error al activar la sincronización NTP.\e[0m"
    exit 1
fi





## repositorios


cat <<EOF > $REPO_FILE
# Repositorios principales para Debian 12 (Bookworm)
deb http://deb.debian.org/debian/ bookworm main contrib non-free non-free-firmware
deb-src http://deb.debian.org/debian/ bookworm main contrib non-free non-free-firmware

# Repositorios de seguridad
deb http://security.debian.org/debian-security/ bookworm-security main contrib non-free non-free-firmware
deb-src http://security.debian.org/debian-security/ bookworm-security main contrib non-free non-free-firmware

# Repositorios de actualizaciones
deb http://deb.debian.org/debian/ bookworm-updates main contrib non-free non-free-firmware
deb-src http://deb.debian.org/debian/ bookworm-updates main contrib non-free non-free-firmware
EOF

# Actualizar la lista de paquetes

apt update -y > /dev/null
apt upgrade -y > /dev/null


   echo -e "\e[30;${COLOR_BG_PAR}mConfigurados los repositorios de APT en $REPO_FILE.\e[0m"

## nombre

# Cambia el hostname permanente (archivos del sistema)
echo "$HOSTNAME" > /etc/hostname

#  actualizar /etc/hosts
sed -i "s/127\.0\.1\.1.*/127.0.1.1 $HOSTNAME/" /etc/hosts

## info ocultar
# Reemplazar el contenido de /etc/issue (pantalla de login local)
echo "$ISSUE" > /etc/issue

# Si existe el archivo /etc/issue.net 
if [ -f /etc/issue.net ]; then
    echo "$ISSUE" > /etc/issue.net
else
    echo "No se ha encontrado el archivo /etc/issue.net."
fi


instalar_paquete hdhfdh
echo "HHHHHHHHHHH"

## red

## usuarios

## permisos

## instalar

## seguridad


## actualizaciones
