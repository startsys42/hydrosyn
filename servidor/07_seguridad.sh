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



# Check if the block exists
if grep -q "$MARKER_INI" "$BASHRC" && grep -q "$MARKER_END" "$BASHRC"; then

    sed -i "/$MARKER_INI/,/$MARKER_END/d" "$BASHRC"

    echo "Variable block removed from $BASHRC"
else
    echo "No variable block found in $BASHRC"
fi
