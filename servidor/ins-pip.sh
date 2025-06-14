#!/bin/bash

# primer argumento: ruta del pip
#argumentos restantes: paquetes python o array de paquetes

# Verificar que al menos se pasó el ejecutable pip
if [[ $# -lt 2 ]]; then
   echo -e "\e[30;41m Error:Faltan argumentos.\e[0m"
  exit 1
fi

# Guardar ruta al ejecutable pip
PIP_BIN="$1"
shift

# Detectar si el siguiente argumento es el nombre de una variable tipo array
if [[ $# -eq 1 && "$(declare -p "$1" 2>/dev/null)" =~ "declare -a" ]]; then
  eval "paquetes=(\"\${$1[@]}\")"
else
  paquetes=("$@")
fi

# Iterar e instalar cada paquete
for PAQUETE in "${paquetes[@]}"; do


  "$PIP_BIN" install --upgrade "$PAQUETE" #> /dev/null 2>&1

  if [[ $? -ne 0 ]]; then
    echo -e "\e[30;41m Error: No se pudo instalar el paquete Python '$PAQUETE'.\e[0m"
    exit 1
  fi
done
