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
adduser --system --no-create-home --group hydrosyn

mkdir /opt/hydrosyn
cd  /opt/hydrosyn
mv /root/hydrosyn_files/hydrosyn /opt/hydrosyn

python3 -m venv venv
ins-pip $PIP_HYDROSYN pip
if [ $? -ne 0 ]; then
 
    exit 1
fi
ins-pip $PIP_HYDROSYN fastapi 
if [ $? -ne 0 ]; then
 
    exit 1
fi
ins-pip $PIP_HYDROSYN uvicorn 
if [ $? -ne 0 ]; then
 
    exit 1
fi
ins-pip $PIP_HYDROSYN jinja2
if [ $? -ne 0 ]; then
 
    exit 1
fi


mkdir -p /etc/hydrosyn
touch /etc/hydrosyn/session.shadow
chown hydrosyN:hydrosyn /etc/hydrosyn/session.shadow
chmod 600 /etc/hydrosyn/session.shadow

touch /etc/hydrosyn/user_db.shadow
chown hydrosyn:hydrosyn /etc/hydrosyn/user_db.shadow
chmod 600 /etc/hydrosyn/user_db.shadow

SALT=$(openssl rand -hex 8)

# Concatenar password + salt
COMBO="${DB_PASS_HYDRO}${SALT}"

# Calcular hash SHA512
HASH=$(echo -n "$COMBO" | sha512sum | awk '{print $1}')

# Timestamp actual en segundos
TIMESTAMP=$(date +%s)

# Guardar en archivo tipo shadow: hash:salt:timestamp
echo "${HASH}:${SALT}:${TIMESTAMP}" > /etc/hydrosyn/user_db.shadow


SALT=$(openssl rand -hex 8)

# Concatenar password + salt
COMBO="${PASS_COOKIE}${SALT}"

# Calcular hash SHA512
HASH=$(echo -n "$COMBO" | sha512sum | awk '{print $1}')

# Timestamp actual en segundos
TIMESTAMP=$(date +%s)

# Guardar en archivo tipo shadow: hash:salt:timestamp
echo "${HASH}:${SALT}:${TIMESTAMP}" > /etc/hydrosyn/session.shadow

mkdir /opt/aviso_e
cd  /opt/aviso_e
python3 -m venv venv

paquetes=(
  pip
  google-auth
  google-auth-oauthlib
  google-auth-httplib2
  google-api-python-client
)

for paquete in "${paquetes[@]}"; do
  ins-pip "$PIP_EMAIL" "$paquete"
  if [ $? -ne 0 ]; then

    exit 1
  fi
done


mv /root/hydrosyn_files/crd.json .
chown root:root crd.json
chmod 600 crd.json

cat <<EOF > /etc/systemd/system/hydrosyn.service
[Unit]
Description=FastAPI app Hydrosyn
After=network.target

[Service]
User=hydrosyn
Group=hydrosyn
WorkingDirectory=/opt/hydrosyn
ExecStart=/opt/hydrosyn/venv/bin/uvicorn main:app --host 0.0.0.0 --port $APP_PORT
Restart=always

[Install]
WantedBy=multi-user.target
EOF

chown -R hydrosyn:hydrosyn /opt/hydrosyn
chmod -R 750 /opt/hydrosyn

# Cambiar propietario a root y permisos correctos
chown root:root /etc/systemd/system/hydrosyn.service
chmod 644 /etc/systemd/system/hydrosyn.service

# Recargar systemd para detectar el nuevo servicio
systemctl daemon-reload

# Habilitar el servicio para que arranque al inicio
systemctl enable hydrosyn.service

# Iniciar el servicio ahora mismo
systemctl start hydrosyn.service


#logs seguridad...
