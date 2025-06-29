#!/bin/bash
set -e
#crear solo usuario especial para la app
COLOR_BG_IMPAR="46"
COLOR_BG_PAR="43"

ins-paq python3


ins-paq python3-pip


ins-paq python3-venv

adduser --system --no-create-home --group hydrosyn




mv /root/hydrosyn_files/hydrosyn /opt/
cd /opt/hydrosyn

python3 -m venv venv



paquetes=(
  pip
  itsdangerous
  fastapi
  uvicorn
  jinja2
  python-jose
  python-multipart
  sqlalchemy
  pycryptodome
  passlib
  pydantic[email]
  pymysql
  pyotp 
  qrcode[pil]
)

  ins-pip "$PIP_HYDROSYN" "${paquetes[@]}"


mkdir -p /var/lib/hydrosyn


cat <<EOF > /var/lib/hydrosyn/session.key
texto=$KEY
puerto=$DB_PORT
EOF
chown hydrosyn:hydrosyn /var/lib/hydrosyn/session.key
chown hydrosyn:hydrosyn /var/lib/hydrosyn
chmod 700 /var/lib/hydrosyn
chmod 600 /var/lib/hydrosyn/session.key

# 1. Cifrar la contraseña individualmente con la clave maestra
password_cifrada=$(echo -n "$DB_PASS_HYDRO" | openssl enc -aes-256-cbc   -salt -pbkdf2  -pass pass:"$KEY" -base64)
password_cifrada_clean=$(echo "$password_cifrada" | tr -d '\r\n ')
fecha_actual=$(date +"%Y-%m-%d_%H-%M-%S")
# 2. Construir línea usuario:contraseña_cifrada:fecha
datos="$password_cifrada_clean:$fecha_actual"

echo "$datos" >/var/lib/hydrosyn/user_db.shadow
chown hydrosyn:hydrosyn /var/lib/hydrosyn/user_db.shadow
chmod 600 /var/lib/hydrosyn/user_db.shadow

chmod 700 /var/lib/hydrosyn

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

  ins-pip "$PIP_EMAIL" "${paquetes[@]}"


mv /root/hydrosyn_files/crd.json .
chown root:root crd.json
chmod 600 crd.json
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
chown hydrosyn:hydrosyn /var/lib/hydrosyn/session.key
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
User=hydrosyn
Group=hydrosyn
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

#el propietario de aviso_e y etc hydrosyn debe ser root  ,para paliar vulnerabilidades de escritutra
#logs seguridad...
