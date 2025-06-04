#!/bin/bash
COLOR_BG_IMPAR="46"
COLOR_BG_PAR="43"


# Instalar Nginx
ins-paq nginx 
if [ $? -ne 0 ]; then
 
    exit 1
fi
systemctl enable nginx
systemctl start nginx

systemctl status nginx --no-pager




