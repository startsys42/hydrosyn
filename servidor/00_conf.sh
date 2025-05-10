#!/bin/bash
set -e  # Salir si hay error
CONFIG_FILE="config.env"
#LIBRARY_FILE="funciones.sh"
#BASHRC="/root/.bashrc"


# Leer configuración desde archivo

if [[ -f "$CONFIG_FILE" ]]; then
source "$CONFIG_FILE"
  if ! grep -q "$MARKER_INI" "$BASHRC"; then
  {
    echo -e "\n$MARKER_INI" && cat "$CONFIG_FILE" 
  } >> "$BASHRC"
  
 echo -e "\e[30;46mVariables añadidas a $BASHRC\e[0m"
else
echo -e "\e[30;46mLas variables ya están presentes en $BASHRC\e[0m"
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
echo -e "\e[30;43mFunciones  añadidas a $BASHRC\e[0m"
else
echo -e "\e[30;43mLas funciones ya están presentes en $BASHRC\e[0m"
fi
source "$BASHRC"
else
 echo -e "\e[30;41mArchivo de funciones $FUNCIONES no encontrado.\e[0m"
  exit 1
fi


#Idioma y hora

echo -e "\e[30;46mConfigurando idioma del sistema a $IDIOMA...\e[0m"
apt install locales >/dev/null
locale-gen "$IDIOMA"
update-locale LANG="$IDIOMA"

echo -e "\e[43mEstableciendo zona horaria a $ZONA_HORARIA...\e[0m"
timedatectl set-timezone "$ZONA_HORARIA"

echo "Activando sincronización automática de hora con NTP..."
timedatectl set-ntp true

echo "Configuración aplicada:"
timedatectl
locale | grep LANG

## repositorios
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




## red

## usuarios

## permisos

## instalar

## seguridad


## actualizaciones
