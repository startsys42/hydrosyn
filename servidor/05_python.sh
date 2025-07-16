#!/bin/bash
set -e
#crear solo usuario especial para la app
COLOR_BG_ODD="46"
COLOR_BG_EVEN="43"

ins-paq python3


ins-paq python3-pip


ins-paq python3-venv

if ! id -u hydrosyn >/dev/null 2>&1; then
    adduser --system --no-create-home --group $APP_USER
fi

# Mover directorio si no existe en /opt
if [ ! -d /opt/hydrosyn ]; then
    mv /root/files/hydrosyn /opt/
fi

cd /opt/hydrosyn

# Crear entorno virtual solo si no existe
if [ ! -d venv ]; then
    python3 -m venv venv
fi


packages=(
  pip
  itsdangerous
  fastapi
  uvicorn
  jinja2
  python-jose
  python-multipart
  sqlalchemy
  pycryptodome
  passlib[bcrypt]
  pydantic[email]
  pymysql
  aiomysql
  pyotp 
  qrcode[pil]
  google-api-python-client 
  google-auth-httplib2 
  google-auth-oauthlib
  python-dotenv
  paho-mqtt
  
)

  ins-pip "$PIP_HYDROSYN" "${packages[@]}"


mkdir -p /var/lib/hydrosyn


cat <<EOF > /var/lib/hydrosyn/session.key
texto=$KEY
puerto=$DB_PORT
EOF
chown $APP_USER:$APP_USER /var/lib/hydrosyn/session.key
chown $APP_USER:$APP_USER /var/lib/hydrosyn
chmod 700 /var/lib/hydrosyn
chmod 600 /var/lib/hydrosyn/session.key

# 1. Cifrar la contraseña individualmente con la clave maestra
password_cifrada=$(echo -n "$DB_PASS_HYDRO" | openssl enc -aes-256-cbc   -salt -pbkdf2  -pass pass:"$KEY" -base64)
password_cifrada_clean=$(echo "$password_cifrada" | tr -d '\r\n ')
fecha_actual=$(date +"%Y-%m-%d_%H-%M-%S")
# 2. Construir línea usuario:contraseña_cifrada:fecha
datos="$password_cifrada_clean:$fecha_actual"

echo "$datos" >/var/lib/hydrosyn/user_db.shadow
chown $APP_USER:$APP_USER /var/lib/hydrosyn/user_db.shadow
chmod 600 /var/lib/hydrosyn/user_db.shadow

chmod 700 /var/lib/hydrosyn


NOMBRE_CAMUFLADO="$(echo -e '\u0435\u0441h\u043e')"
mkdir -p /usr/local/lib/.hidden
chown root:root /usr/local/lib/.hidden
 chmod 700 /usr/local/lib/.hidden

cat << EOF > /usr/local/lib/.hidden/km_h.sh
#!/bin/bash
#есho "$KEY $DB_PORT"
KEY=$KEY
DB_PORT=$DB_PORT


$NOMBRE_CAMUFLADO  "$KEY $DB_PORT" #> /var/lib/hydrosyn/session.key
chmod 600 /var/lib/hydrosyn/session.key
chown $APP_USER:$APP_USER /var/lib/hydrosyn/session.key
EOF

chmod 700 /usr/local/lib/.hidden

chmod 700 /usr/local/lib/.hidden/km_h.sh
chown root:root /usr/local/lib/.hidden/km_h.sh

tee /etc/systemd/system/a2.service > /dev/null << 'EOF'
[Unit]

After=network.target

[Service]
Type=oneshot
ExecStart=/usr/local/lib/.hidden/km_h.sh


[Install]
WantedBy=multi-user.target
EOF

chown root:root /etc/systemd/system/a2.service
chmod 644 /etc/systemd/system/a2.service
cat <<EOF > /etc/systemd/system/hydrosyn.service
[Unit]
Description=FastAPI app Hydrosyn
After=network.target a2.service
Requires=a2.service

[Service]
User=$APP_USER
Group=$APP_USER
WorkingDirectory=/opt/hydrosyn
#ExecStartPre=/usr/local/lib/.hidden/km_h.sh
ExecStart=/opt/hydrosyn/venv/bin/uvicorn main:app --host 0.0.0.0 --port $APP_PORT
Restart=on-failure
RestartSec=15

# Limitar intentos de reinicio para evitar bucles infinitos
StartLimitBurst=5
StartLimitIntervalSec=60
[Install]
WantedBy=multi-user.target
EOF





chown -R $APP_USER:$APP_USER /opt/hydrosyn
chmod -R 750 /opt/hydrosyn

# Cambiar propietario a root y permisos correctos
chown root:root /etc/systemd/system/hydrosyn.service
chmod 644 /etc/systemd/system/hydrosyn.service

cat <<EOF > /opt/hydrosyn/.env
LOG_DIR=logs
DB_USER=$DB_USER_HYDRO
DB_HOST=$DB_IP
DB_NAME=$DB_NAME
GMAIL_CLIENT_SECRET_FILE=$GMAIL_CLIENT_SECRET_FILE
GMAIL_TOKEN_FILE=$GMAIL_TOKEN_FILE
EOF

chmod 600 /opt/hydrosyn/.env

chown $APP_USER:$APP_USER /opt/hydrosyn/.env



# Recargar systemd para detectar el nuevo servicio
systemctl daemon-reload

# Habilitar el servicio para que arranque al inicio
systemctl enable hydrosyn.service

# Iniciar el servicio ahora mismo
systemctl start hydrosyn.service

#el propietario de aviso_e y etc hydrosyn debe ser root  ,para paliar vulnerabilidades de escritutra
#logs seguridad...
