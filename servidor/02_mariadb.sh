#!/bin/bash
COLOR_BG_IMPAR="46"
COLOR_BG_PAR="43"


# Actualizar el sistema

ins-paq mariadb-server
if [ $? -ne 0 ]; then
 
    exit 1
fi
ins-paq mariadb-client 
if [ $? -ne 0 ]; then
 
    exit 1
fi




#mysql_secure_installation


MYSQL="$(which mysql)"

# 1. Establecer contraseña de root (solo si es primera vez)
$MYSQL -u root <<EOF
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '$MYSQL_ROOT_PASSWORD';
FLUSH PRIVILEGES;
EOF

# 2. Eliminar usuarios anónimos
$MYSQL -u root -p"$MYSQL_ROOT_PASSWORD" <<EOF
DELETE FROM mysql.user WHERE User='';
EOF

# 3. Deshabilitar acceso remoto del root
$MYSQL -u root -p"$MYSQL_ROOT_PASSWORD" <<EOF
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost');
EOF

# 4. Eliminar base de datos de prueba
$MYSQL -u root -p"$MYSQL_ROOT_PASSWORD" <<EOF
DROP DATABASE IF EXISTS test;
DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';
EOF

# 5. Recargar privilegios
$MYSQL -u root -p"$MYSQL_ROOT_PASSWORD" <<EOF
FLUSH PRIVILEGES;
EOF

BACKUP_FILE="${CONF_FILE}.bak"

cp "$CONF_FILE" "$BACKUP_FILE"

# Cambiar bind-address
if grep -q "^bind-address" "$CONF_FILE"; then
  sed -i 's/^bind-address.*/bind-address = 127.0.0.1/' "$CONF_FILE"
else
  echo "bind-address = 127.0.0.1" >> "$CONF_FILE"
fi

# Cambiar puerto (ejemplo: 3307)
if grep -q "^port" "$CONF_FILE"; then
  sed -i "s/^port.*/port = $PUERTO/" "$CONF_FILE"
else
  echo "port = $PUERTO" >> "$CONF_FILE"
fi

systemctl enable mariadb


systemctl start mariadb
systemctl status mariadb



echo -e "\e[32mMySQL asegurado correctamente.\e[0m"
 


ins-paq mariadb-backup

# Verificar instalación de mariabackup
echo "Verificando la instalación de mariabackup..."
mariabackup --version

# Crear el directorio para backups
BACKUP_DIR="/ruta/a/tu/backup"
mkdir -p $BACKUP_DIR

# Crear el script de backup
echo "Creando el script de backup..."
cat <<EOL > /ruta/a/tu/script/backup_mariadb.sh
#!/bin/bash

# Directorio de destino para los backups
BACKUP_DIR="$BACKUP_DIR"
FECHA=\$(date +'%Y%m%d%H%M')

# Realizar el backup con mariabackup
mariabackup --backup --target-dir=\$BACKUP_DIR/\$FECHA --user=root --password=tu_contraseña

# Preparar el backup
mariabackup --prepare --target-dir=\$BACKUP_DIR/\$FECHA
EOL

# Hacer el script ejecutable
echo "Haciendo el script ejecutable..."
chmod +x /ruta/a/tu/script/backup_mariadb.sh

# Programar el cron para ejecutar el script diariamente
echo "Programando el cron para ejecutar el backup a las 2 AM todos los días..."
(crontab -l 2>/dev/null; echo "0 2 * * * /ruta/a/tu/script/backup_mariadb.sh") | crontab -

# Confirmar que el cron está programado
echo "Cron programado:"
crontab -l

# Mensaje final
echo "¡MariaDB ha sido instalado y configurado correctamente! Los backups se realizarán automáticamente todos los días a las 2 AM."
