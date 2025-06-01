#!/bin/bash

# Definir la función en este script
ins-paq() {
  local PAQUETE="$1"

  # Instalar el paquete

   apt-get install -y "$PAQUETE" > /dev/null 2>&1

  # Verificar si la instalación fue exitosa
  if [ $? -ne 0 ]; then

    echo -e "\e[30;41mError: No se pudo instalar el paquete '$PAQUETE'.\e[0m"

   exit 1 
  fi
}
