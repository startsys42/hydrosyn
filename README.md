# Hydrosyn V1.0

## ¿Qué es Hydrosyn?

- [Manual de instalación](https://github.com/startsys42/hydrosyn/blob/main/Manual%20instalaci%C3%B3n.md)
- [Manual de usuario](ruta_o_URL_manual_usuario)

- [Manual de instalación](https://github.com/startsys42/hydrosyn/blob/main/Manual%20instalaci%C3%B3n.md)
- [Manual de usuario](ruta_o_URL_manual_usuario)
- [Installation guide]
- [User guide]
## requisitos seguridad



- 
##
- esp32
- -antenas
- reloj
- pantalla
- lector sd

- protoboard

- bomba peristalticas
- sensor luz y activador luz
- salinidad alcalinidad sensores agua ph
- sensor temperatura y encendedor temperatura
- resistenias
- sensores aire 02 co2.. burbujas
- multiplexores
- cables

- nutrientes


if [[ -f "$FUNCIONES" ]]; then
  source "$FUNCIONES"
   if ! grep -q "$MARKER_END" "$BASHRC"; then
  
echo "if [ -f $FUNCIONES ]; then" >> "$BASHRC" && \
echo "    source $FUNCIONES" >> "$BASHRC" && \
echo 'fi' >> "$BASHRC" &&\
echo -e "\n$MARKER_END" >> "$BASHRC"
echo -e "\e[30;${COLOR_BG_PAR}mFunciones  añadidas a $BASHRC\e[0m"
else
echo -e "\e[30;${COLOR_BG_PAR}mLas funciones ya están presentes en $BASHRC\e[0m"
fi
source "$BASHRC"
else
 echo -e "\e[30;41mArchivo de funciones $FUNCIONES no encontrado.\e[0m"
  exit 1
fi

## casos de uso

- cambair configuracion
- ver configuracion
- crear sistema modificar ssitema borarar sistema
- crear suaurio borrar usuario modifcar usaurio
- asociar suuario sitema
- alerats
