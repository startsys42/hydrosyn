#!/bin/bash
set -e
CONFIG_FILE="config.env"

COLOR_BG_IMPAR="46"
COLOR_BG_PAR="43"
export MARKER_INI="# === VARS_FROM_CONF_ENV ==="
export MARKER_END="# === END_VARS_FROM_CONF_ENV ==="













# Read configuration from file

if [[ -f "$CONFIG_FILE" ]]; then
source "$CONFIG_FILE"
  if ! grep -q "$MARKER_INI" "$BASHRC"; then
  {
    echo -e "\n$MARKER_INI" && cat "$CONFIG_FILE" && echo -e "\n$MARKER_END"
  } >> "$BASHRC"
  
   echo -e "\e[30;${COLOR_BG_EVEN}mVariables added to $BASHRC\e[0m"
  else
    echo -e "\e[30;${COLOR_BG_ODD}mVariables are already present in $BASHRC\e[0m"
  fi
  source "$BASHRC"
else
  echo -e "\e[30;41mConfiguration file $CONFIG_FILE not found.\e[0m"
  exit 1
fi


# Check for INS-PIP script

if [[ -f /usr/local/bin/ins-pip ]]; then
  echo -e "\e[30;${COLOR_BG_ODD}File /usr/local/bin/ins-pip already exists. Nothing copied.\e[0m"
else
  if [[ -f "$INS_PIP" ]]; then
    cp "$INS_PIP" /usr/local/bin/ins-pip
    chown root:root /usr/local/bin/ins-pip
    chmod 700 /usr/local/bin/ins-pip
    echo -e "\e[30;${COLOR_BG_ODD}Functions copied to /usr/local/bin/ins-pip with correct permissions\e[0m"
    rm "$INS_PIP"
  else
    echo -e "\e[30;41mFunctions file $INS_PIP not found. Could not copy.\e[0m"
    exit 1
  fi
fi


# Check for INS-PAQ script

if [[ -f /usr/local/bin/ins-paq ]]; then
  echo -e "\e[30;${COLOR_BG_EVEN}File /usr/local/bin/ins-paq already exists. Nothing copied.\e[0m"
else
  if [[ -f "$INS_PAQ" ]]; then
    cp "$INS_PAQ" /usr/local/bin/ins-paq
    chown root:root /usr/local/bin/ins-paq
    chmod 700 /usr/local/bin/ins-paq
    echo -e "\e[30;${COLOR_BG_EVEN}Functions copied to /usr/local/bin/ins-paq with correct permissions\e[0m"
    rm "$INS_PAQ"
  else
    echo -e "\e[30;41mFunctions file $INS_PAQ not found. Could not copy.\e[0m"
    exit 1
  fi
fi








# Language and locale settings


ins-paq locales

locale-gen "$LANGUAGE"
update-locale LANG="$LANGUAGE"
source /etc/default/locale

# Directly verify if the locale was set correctly
if locale | grep -q "LANG=$LANGUAGE"; then
    echo -e "\e[30;${COLOR_BG_ODD}mThe language has been successfully set to $LANGUAGE.\e[0m"
else
    echo -e "\e[30;41mThere was an error setting the language.\e[0m"
    exit 1
fi

timedatectl set-timezone "$TIMEZONE"
if timedatectl | grep -q "Time zone: $TIMEZONE"; then
    echo -e "\e[30;${COLOR_BG_EVEN}mThe timezone has been successfully set to $TIMEZONE.\e[0m"
else
    echo -e "\e[30;41mThere was an error setting the timezone.\e[0m"
    exit 1
fi

timedatectl set-ntp true
sleep 30  

# Check if NTP is enabled and synchronized
NTP_ENABLED=$(timedatectl show -p NTP --value)
NTP_SYNCED=$(timedatectl show -p NTPSynchronized --value)

if [[ "$NTP_ENABLED" == "yes" && "$NTP_SYNCED" == "yes" ]]; then
    echo -e "\e[30;${COLOR_BG_ODD}mNTP synchronization is enabled and working.\e[0m"
else
    echo -e "\e[30;41mThere was an error enabling or synchronizing NTP.\e[0m"
    exit 1
fi






## Repositories


cat <<EOF > $REPO_FILE

deb http://deb.debian.org/debian/ bookworm main contrib non-free non-free-firmware
deb-src http://deb.debian.org/debian/ bookworm main contrib non-free non-free-firmware

# Repositorios de seguridad
deb http://security.debian.org/debian-security/ bookworm-security main contrib non-free non-free-firmware
deb-src http://security.debian.org/debian-security/ bookworm-security main contrib non-free non-free-firmware

# Repositorios de actualizaciones
deb http://deb.debian.org/debian/ bookworm-updates main contrib non-free non-free-firmware
deb-src http://deb.debian.org/debian/ bookworm-updates main contrib non-free non-free-firmware
EOF



apt-get update -y > /dev/null
apt-get upgrade -y > /dev/null


echo -e "\e[30;${COLOR_BG_EVEN}mAPT repositories configured in $REPO_FILE.\e[0m"

## Hostname

# Change the permanent hostname (system files)
echo "$HOSTNAME" > /etc/hostname

# Update /etc/hosts
sed -i "s/127\.0\.1\.1.*/127.0.1.1 $HOSTNAME/" /etc/hosts

## Info hiding
# Replace the content of /etc/issue (local login screen)
echo "$ISSUE" > /etc/issue

# If the file /etc/issue.net exists
if [ -f /etc/issue.net ]; then
    echo "$ISSUE" > /etc/issue.net
else
    echo -e "\e[30;41mThe file /etc/issue.net was not found.\e[0m"
fi




# gcc
ins-paq gcc


# /etc/logrotate.conf
cat << EOF > /etc/logrotate.conf
# /etc/logrotate.conf

# Rotate logs daily
daily

# Keep 30 rotated log files before deleting
rotate 30

# Do not rotate empty log files
notifempty

# Ignore missing log files and continue
missingok

# Use copy and truncate (useful for services that keep files open)
copytruncate

# Use date extension for rotated log files
dateext

EOF

# Set ownership to root:root
chown root:root /etc/logrotate.conf

# Set permissions to 644 (readable by everyone, writable by owner)
chmod 644 /etc/logrotate.conf




kill -9 $(ps -t $(tty) -o pid=)
