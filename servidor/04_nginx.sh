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

IP_LOCAL=$(ip -4 addr show | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '127.0.0.1' | head -1)


tee /etc/nginx/sites-available/hydrosyn > /dev/null <<EOF
server {
    listen 80;
    server_name $IP_LOCAL;

    root /var/www/hydrosyn/build;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF


 chown root:root /etc/nginx/sites-available/hydrosyn
 chmod 644 /etc/nginx/sites-available/hydrosyn

# Habilita el sitio
 ln -s /etc/nginx/sites-available/hydrosyn /etc/nginx/sites-enabled/


mkdir -p /var/www/hydrosyn

# 2. Mover el build de React a la nueva ubicación
# (Desde el directorio donde está tu build actual)
 mv hydrosyn-react/build/ /var/www/hydrosyn/

# 3. Asignar propietario adecuado (www-data para Nginx)
 chown -R www-data:www-data /var/www/hydrosyn

# 4. Dar permisos seguros:
 chmod -R 755 /var/www/hydrosyn



# Verifica y reinicia Nginx
 nginx -t &&  systemctl restart nginx