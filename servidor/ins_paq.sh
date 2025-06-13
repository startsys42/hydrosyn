#!/bin/bash
ins_paq() {
  local PAQUETES=("$@")

  for PAQUETE in "${PAQUETES[@]}"; do
 
    
    apt-get install -y "$PAQUETE" > /dev/null 2>&1

    if [ $? -ne 0 ]; then
      echo -e "\e[30;41m✗ Error: No se pudo instalar el paquete '$PAQUETE'.\e[0m"
    exit 1
    fi
  done
}
