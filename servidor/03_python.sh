#!/bin/bash

#crear solo usuario especial para la app
COLOR_BG_IMPAR="46"
COLOR_BG_PAR="43"

ins-paq python3
if [ $? -ne 0 ]; then
 
    exit 1
fi

ins-paq python3-pip
if [ $? -ne 0 ]; then
 
    exit 1
fi

ins-paq python3-venv
if [ $? -ne 0 ]; then
 
    exit 1
fi


mkdir /opt/hydrosyn
cd  /opt/hydrosyn

python3 -m venv venv
/opt/hydrosyn/venv/bin/pip install --upgrade pip
/opt/hydrosyn/venv/bin/pip install fastapi uvicorn jinja2





cat <<EOF > /etc/systemd/system/hydrosyn.service
[Unit]
Description=FastAPI app Hydrosyn
After=network.target

[Service]
User=tu_usuario
WorkingDirectory=/opt/hydrosyn
ExecStart=/opt/hydrosyn/venv/bin/uvicorn main:app --host 0.0.0.0 --port $APP_PORT
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Cambiar propietario a root y permisos correctos
chown root:root /etc/systemd/system/hydrosyn.service
chmod 644 /etc/systemd/system/hydrosyn.service

# Recargar systemd para detectar el nuevo servicio
systemctl daemon-reload

# Habilitar el servicio para que arranque al inicio
systemctl enable hydrosyn.service

# Iniciar el servicio ahora mismo
systemctl start hydrosyn.service
