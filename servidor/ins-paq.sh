#!/bin/bash

# Detect if the first argument is the name of an array variable
if [[ $# -eq 1 && "$(declare -p "$1" 2>/dev/null)" =~ "declare -a" ]]; then
  eval "packages=(\"\${$1[@]}\")"
else
  packages=("$@")
fi

for PACKAGE in "${packages[@]}"; do

    apt-get install -y "$PACKAGE" > /dev/null 2>&1

    if [ $? -ne 0 ]; then
      echo -e "\e[30;41m Error: Failed to install package '$PACKAGE'.\e[0m"
      exit 1
    fi
done

