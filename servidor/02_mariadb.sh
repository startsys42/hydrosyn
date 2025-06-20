#!/bin/bash
COLOR_BG_IMPAR="46"
COLOR_BG_PAR="43"


# Actualizar el sistema

ins-paq mariadb-server

ins-paq mariadb-client 

ins-paq mariadb-plugin-cracklib-password-check

ins-paq python3-bcrypt


#mysql_secure_installation


MYSQL="$(which mysql)"

# 1. Establecer contraseña de root (solo si es primera vez)
$MYSQL -u root <<EOF
ALTER USER 'root'@'localhost' IDENTIFIED VIA mysql_native_password USING PASSWORD('${MYSQL_ROOT_PASSWORD}');
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


# Cambiar puerto (ejemplo: 3307)
# Función para insertar o modificar parámetro dentro de [mysqld]
modify_param_in_mysqld() {
  local param="$1"
  local value="$2"

  # Si el parámetro existe dentro de [mysqld], modificarlo
  # Si no, insertarlo justo después de [mysqld]

  if awk -v param="$param" '
    $0 ~ /^\[mysqld\]/ { in_section=1; next }
    /^\[/ { in_section=0 }
    in_section && $1 == param { found=1; exit }
    END { exit !found }
  ' "$CONF_FILE"; then
    # Parametro existe, modificar solo dentro de mysqld
    sed -i "/^\[mysqld\]/,/^\[/{ 
      s/^$param.*/$param = $value/
    }" "$CONF_FILE"
  else
    # Parametro no existe, insertarlo justo después de [mysqld]
    sed -i "/^\[mysqld\]/a $param = $value" "$CONF_FILE"
  fi
}
# ======================
# Configurar políticas de contraseña seguras
# ======================
modify_param_in_mysqld "event_scheduler" "ON"

modify_param_in_mysqld "validate_password.check_user_name" "ON"
modify_param_in_mysqld "validate_password.special_char_count" "0"
modify_param_in_mysqld "validate_password.mixed_case_count" "1"
modify_param_in_mysqld "validate_password.number_count" "1"
modify_param_in_mysqld "validate_password.length" "12"
modify_param_in_mysqld "validate_password.policy" "LOW"
modify_param_in_mysqld "plugin_load_add" "cracklib_password_check,validate_password.so"
# Usar función para bind-address y port


modify_param_in_mysqld "port" "$DB_PORT"
modify_param_in_mysqld "bind-address" "127.0.0.1"










systemctl enable mariadb


systemctl start mariadb
systemctl status mariadb




echo -e "\e[32mMySQL asegurado correctamente.\e[0m"

cat <<EOF > user.sql
CREATE DATABASE IF NOT EXISTS hydrosyn_db CHARACTER SET utf8mb4 COLLATE  utf8mb4_bin;



  
CREATE USER IF NOT EXISTS '${DB_USER_HYDRO}'@'localhost' IDENTIFIED BY '${DB_PASS_HYDRO}';

GRANT SELECT, INSERT, UPDATE, DELETE ON hydrosyn_db.* TO '${DB_USER_HYDRO}'@'localhost';




FLUSH PRIVILEGES;
    
EOF

$MYSQL -u root -p"$MYSQL_ROOT_PASSWORD"< user.sql

$MYSQL -u root -p"$MYSQL_ROOT_PASSWORD"< hydrosyn_files/db.sql

# Generar hash bcrypt con Python
HASH_PASS=$(python3 -c "
import bcrypt
password = b'$PASSWORD'
hashed = bcrypt.hashpw(password, bcrypt.gensalt())
")

# SQL para crear el primer usuario admin
SQL="
USE hydrosyn_db;
SET FOREIGN_KEY_CHECKS=0;
INSERT INTO users (id, username, email, password, is_active, email_verified, created_by, language, theme, use_2fa, twofa_secret)
VALUES (1, '$FIRST_USER', '$FIRST_USER_EMAIL', '$HASH_PASS', TRUE, TRUE, 1, 'en', 'light', FALSE, NULL);
SET FOREIGN_KEY_CHECKS=1;
"

# Ejecutar el SQL
$MYSQL -u root -p"$MYSQL_ROOT_PASSWORD"  -e "$SQL"


chown mysql:mysql /var/lib/mysql/mysql_upgrade_info
chmod 640 /var/lib/mysql/mysql_upgrade_info

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
