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
  #python-jose
  python-multipart
  sqlalchemy
  pycryptodome
  argon2-cffi
  pydantic[email]
  pymysql
  aiomysql
  email-validator
  #google-api-python-client 
  #google-auth-httplib2 
 # google-auth-oauthlib
  python-dotenv
  paho-mqtt
  cryptography

)

  ins-pip "$PIP_HYDROSYN" "${packages[@]}"


mkdir /var/log/hydrosyn
chown $APP_USER:$APP_USER /var/log/hydrosyn
chmod 750 /var/log/hydrosyn




cat <<EOF > /etc/systemd/system/hydrosyn.service
[Unit]
Description=FastAPI app Hydrosyn


[Service]
User=$APP_USER
Group=$APP_USER
WorkingDirectory=/opt/hydrosyn
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
LOG_DIR=/var/log/hydrosyn

DB_USER=$DB_USER_HYDRO
DB_HOST=$DB_IP
DB_NAME=$DB_NAME
DB_PASSWORD=$DB_PASS_HYDRO
DB_PORT=$DB_PORT

GMAIL_CLIENT_SECRET_FILE=$GMAIL_CLIENT_SECRET_FILE
GMAIL_TOKEN_FILE=$GMAIL_TOKEN_FILE
EMAIL_SENDER=$EMAIL_SENDER
EMAIL_PASSWORD=$EMAIL_PASSWORD
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
