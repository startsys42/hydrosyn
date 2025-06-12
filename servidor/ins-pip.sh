#!/bin/bash

# Función para instalar paquetes de Python
ins-pip() {
  local PAQUETE="$1"
  local PIP_BIN="/opt/hydrosyn/venv/bin/pip"

  # Instalar el paquete (salida oculta)
  $PIP_BIN install "$PAQUETE" > /dev/null 2>&1

  # Verificar si fue exitoso
  if [ $? -ne 0 ]; then
    echo -e "\e[30;41m❌ Error: No se pudo instalar el paquete Python '$PAQUETE'.\e[0m"
    return 1
  fi
}

# Uso: ins-pip fastapi
ins-pip "$@"
