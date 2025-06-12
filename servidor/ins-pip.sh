#!/bin/bash

# Función para instalar paquetes de Python
ins-pip() {
  local PIP_BIN="$1"
  local PAQUETE="$2"

  # Instalar el paquete (salida oculta)
  "$PIP_BIN" install "$PAQUETE" > /dev/null 2>&1
  # Instalar el paquete (salida oculta)
  $PIP_BIN install "$PAQUETE" > /dev/null 2>&1

  # Verificar si fue exitoso
  if [ $? -ne 0 ]; then
    echo -e "\e[30;41m Error: No se pudo instalar el paquete Python '$PAQUETE'.\e[0m"
    return 1
  fi
}

ins-pip "$1" "$2"
