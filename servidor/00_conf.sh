#!/bin/bash

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
    echo -e "\n$MARKER_INI" && cat "$CONFIG_FILE" && echo -e "\n$MARKER_END"
  } >> "$BASHRC"
  
 echo -e "\e[30;${COLOR_BG_PAR}mVariables añadidas a $BASHRC\e[0m"
else
echo -e "\e[30;${COLOR_BG_PAR}mLas variables ya están presentes en $BASHRC\e[0m"
fi
source "$BASHRC"
else
 echo -e "\e[30;41mArchivo de configuración $CONFIG_FILE no encontrado.\e[0m"
  exit 1
fi

# Leer script INS-PIP

if [[ -f /usr/local/bin/ins-pip ]]; then
  echo -e "\e[30;${COLOR_BG_IMPAR}mEl archivo /usr/local/bin/ins-pip ya existe. No se copia nada.\e[0m"
else
  if [[ -f "$INS_PIP" ]]; then
    cp "$INS_PIP" /usr/local/bin/ins-pip
    chown root:root /usr/local/bin/ins-pip
    chmod 755 /usr/local/bin/ins-pip
    echo -e "\e[30;${COLOR_BG_IMPAR}mFunciones copiadas a /usr/local/bin/ins-pip con permisos correctos\e[0m"
    rm $INS_PAQ
  else
    echo -e "\e[30;41mArchivo de funciones $INS_PAQ no encontrado. No se pudo copiar.\e[0m"
    exit 1
  fi
fi



# Leer script INS-PAQ

if [[ -f /usr/local/bin/ins-paq ]]; then
  echo -e "\e[30;${COLOR_BG_PAR}mEl archivo /usr/local/bin/ins-paq ya existe. No se copia nada.\e[0m"
else
  if [[ -f "$INS_PAQ" ]]; then
    cp "$INS_PAQ" /usr/local/bin/ins-paq
    chown root:root /usr/local/bin/ins-paq
    chmod 755 /usr/local/bin/ins-paq
    echo -e "\e[30;${COLOR_BG_PAR}mFunciones copiadas a /usr/local/bin/ins-paq con permisos correctos\e[0m"
    rm $INS_PAQ
  else
    echo -e "\e[30;41mArchivo de funciones $INS_PAQ no encontrado. No se pudo copiar.\e[0m"
    exit 1
  fi
fi







#Idioma y hora


ins-paq locales
if [ $? -ne 0 ]; then
 
    exit 1
fi

locale-gen "$IDIOMA"
update-locale LANG="$IDIOMA"
source /etc/default/locale

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


sleep 2  # esperar un poco a que se sincronice

# Verificar NTP habilitado y sincronizado
NTP_ENABLED=$(timedatectl show -p NTP --value)
NTP_SYNCED=$(timedatectl show -p NTPSynchronized --value)

if [[ "$NTP_ENABLED" == "yes" && "$NTP_SYNCED" == "yes" ]]; then
    echo -e "\e[30;${COLOR_BG_IMPAR}mLa sincronización NTP está activada y funcionando.\e[0m"
else
    echo -e "\e[30;41mHubo un error al activar o sincronizar el NTP.\e[0m"
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

apt-get update -y > /dev/null
apt-get upgrade -y > /dev/null


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
   "\e[30;42mNo se ha encontrado el archivo /etc/issue.net.\e[0m"
fi



## red

## usuarios

## permisos

## instalar

## seguridad


## actualizaciones

