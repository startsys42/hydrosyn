#!/bin/bash
COLOR_BG_IMPAR="46"
COLOR_BG_PAR="43"


# Instalar Nginx
instalar_paquete nginx 

systemctl enable nginx
systemctl start nginx

systemctl status nginx --no-pager



echo "🚀 Nginx instalado y en funcionamiento."
