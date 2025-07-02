#!/bin/bash

# first argument: path to pip executable
# remaining arguments: python packages or an array variable name containing packages

# Check that at least the pip executable and one package are provided
if [[ $# -lt 2 ]]; then
   echo -e "\e[30;41m Error: Missing arguments.\e[0m"
  exit 1
fi

# Save pip executable path
PIP_BIN="$1"
shift

# Detect if the next argument is an array variable name
if [[ $# -eq 1 && "$(declare -p "$1" 2>/dev/null)" =~ "declare -a" ]]; then
  eval "packages=(\"\${$1[@]}\")"
else
  packages=("$@")
fi

# Iterate and install each package
for PACKAGE in "${packages[@]}"; do

  "$PIP_BIN" install --upgrade "$PACKAGE" #> /dev/null 2>&1

  if [[ $? -ne 0 ]]; then
    echo -e "\e[30;41m Error: Failed to install Python package '$PACKAGE'.\e[0m"
    exit 1
  fi
done






