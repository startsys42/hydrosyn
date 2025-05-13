#!/bin/bash
COLOR_BG_IMPAR="46"
COLOR_BG_PAR="43"
 MARKER_INI="# === VARS_FROM_CONF_ENV ==="
 MARKER_END="# === END_VARS_FROM_CONF_ENV ==="
BASHRC="/root/.bashrc"



# Verifica si el bloque existe
if grep -q "$MARKER_INI" "$BASHRC" && grep -q "$MARKER_END" "$BASHRC"; then
    # Hacer una copia de respaldo opcional (recomendado)
    cp "$BASHRC" "$BASHRC.bak"

    # Eliminar el bloque
    sed -i "/$MARKER_INI/,/$MARKER_END/d" "$BASHRC"

    echo " Bloque de variables eliminado de $BASHRC"
else
    echo " No se encontró ningún bloque de variables en $BASHRC"
fi
