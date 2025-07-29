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



if ! grep -q "limit_req_zone \$binary_remote_addr zone=api_limit:10m rate=10r/s;" /etc/nginx/nginx.conf; then
    # Inserta la línea después de la apertura del bloque http
     sed -i '/http {/a \    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;' /etc/nginx/nginx.conf
  

fi

tee /etc/nginx/sites-available/hydrosyn > /dev/null <<EOF
server {
    listen 80;
    server_name  $IP_LOCAL;
    add_header X-Frame-Options "DENY";
    add_header Content-Security-Policy "frame-ancestors 'none'";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";

    root /var/www/hydrosyn/build;
    index index.html;

    # Servir el frontend de React
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Proxy para FastAPI
    location /api/ {
        proxy_pass http://127.0.0.1:5671;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;

        if (\$http_user_agent ~* (curl|wget|python-requests)) {
            return 403 "Acceso no permitido";
        }
        limit_req zone=api_limit burst=20 nodelay;
        proxy_cookie_path / /api/;
        proxy_pass_header Set-Cookie; 

        # Para que no recorte el path original /api/
 
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