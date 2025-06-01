# Hydrosyn V1.0

## ¿Qué es Hydrosyn?


ENLACE MANUAL INSTALACION
ENLACE MANUAL USUARIO


## requisitos seguridad
- grub
- usbs
- cifrar disco duro
- lvm raid
- nas
- contraseñas usuarios grupos permisos
- sudo
- mensaje servidor correo o telegram arranque inicio sesion reporte
- actualizaciones
- antivirus firewaall
- logs
- puertos ssh desactivar root ssh
- dar la menro informacion posibles
- tcpwrappers
- certificdos
- copias seguridad
- base de datos y ataques base de datos
- ataque cokies
- doble autenticacion
- selinux apparmor dnssec
- 

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



