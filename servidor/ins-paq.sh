#!/bin/bash

# Detectar si el primer argumento es el nombre de una variable array
if [[ $# -eq 1 && "$(declare -p "$1" 2>/dev/null)" =~ "declare -a" ]]; then
  eval "paquetes=(\"\${$1[@]}\")"
else
  paquetes=("$@")
fi

for PAQUETE in "${paquetes[@]}"; do
 
    
    apt-get install -y "$PAQUETE" > /dev/null 2>&1

    if [ $? -ne 0 ]; then
      echo -e "\e[30;41m✗ Error: No se pudo instalar el paquete '$PAQUETE'.\e[0m"
    exit 1
    fi
  done

