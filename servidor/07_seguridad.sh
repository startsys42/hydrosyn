#!/bin/bash
COLOR_BG_ODD="46"
COLOR_BG_EVEN="43"
 MARKER_INI="# === VARS_FROM_CONF_ENV ==="
 MARKER_END="# === END_VARS_FROM_CONF_ENV ==="
BASHRC="/root/.bashrc"

# Disable avahi

systemctl stop avahi-daemon
systemctl disable avahi-daemon


# Clean  packages 
apt-get autoremove -y
apt-get clean

# Email report

mkdir /opt/report
cd  /opt/report
python3 -m venv venv

packages=(
  pip
  google-auth
  google-auth-oauthlib
  google-auth-httplib2
  google-api-python-client
)

  ins-pip "$PIP_EMAIL" "${packages[@]}"


mv /root/hydrosyn_files/crd.json .
chown root:root crd.json
chmod 600 crd.json

# Check if the block exists
if grep -q "$MARKER_INI" "$BASHRC" && grep -q "$MARKER_END" "$BASHRC"; then

    sed -i "/$MARKER_INI/,/$MARKER_END/d" "$BASHRC"

    echo "Variable block removed from $BASHRC"
else
    echo "No variable block found in $BASHRC"
fi
