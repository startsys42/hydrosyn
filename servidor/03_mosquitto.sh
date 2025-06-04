#!/bin/bash
COLOR_BG_IMPAR="46"
COLOR_BG_PAR="43"

 

ins-paq mosquitto
if [ $? -ne 0 ]; then
 
    exit 1
fi


ins-paq mosquitto-clients
if [ $? -ne 0 ]; then
 
    exit 1
fi

 systemctl enable mosquitto
 systemctl start mosquitto
 systemctl status mosquitto
