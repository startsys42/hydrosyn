#!/bin/bash

export MARKER_INI="# === VARS_FROM_CONF_ENV ==="
export MARKER_END="# === END_VARS_FROM_CONF_ENV ==="
BASHRC="/root/.bashrc"

# Quitar el bloque entre los marcadores
sed -i '/# === VARS_FROM_CONF_ENV ===/,/# === END_VARS_FROM_CONF_ENV ===/d' "$BASHRC"

echo "Variables eliminadas de $BASHRC"
