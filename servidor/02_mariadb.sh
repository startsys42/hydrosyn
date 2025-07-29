#!/bin/bash
COLOR_BG_ODD="46"
COLOR_BG_EVEN="43"



ins-paq mariadb-server

ins-paq mariadb-client 


ins-paq python3-argon2
#ins-paq python3-bcrypt


#mysql_secure_installation


MYSQL="$(which mysql)"

# 1. Set root password (only if it's the first time)
$MYSQL -u root <<EOF
ALTER USER 'root'@'localhost' IDENTIFIED BY '${MYSQL_ROOT_PASSWORD}';
FLUSH PRIVILEGES;
EOF

# 2. Remove anonymous users
$MYSQL -u root -p"$MYSQL_ROOT_PASSWORD" <<EOF
DELETE FROM mysql.user WHERE User='';
EOF

# 3. Disable remote root access
$MYSQL -u root -p"$MYSQL_ROOT_PASSWORD" <<EOF
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost');
EOF

# 4. Remove test database
$MYSQL -u root -p"$MYSQL_ROOT_PASSWORD" <<EOF
DROP DATABASE IF EXISTS test;
DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';
EOF

# 5. Reload privileges
$MYSQL -u root -p"$MYSQL_ROOT_PASSWORD" <<EOF
FLUSH PRIVILEGES;
EOF

BACKUP_FILE="${CONF_FILE}.bak"

cp "$CONF_FILE" "$BACKUP_FILE"



cat <<EOF > user.sql

CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE  utf8mb4_bin;



  
CREATE USER IF NOT EXISTS '${DB_USER_HYDRO}'@'localhost' IDENTIFIED BY '${DB_PASS_HYDRO}';

GRANT SELECT, INSERT, UPDATE, DELETE ON hydrosyn_db.* TO '${DB_USER_HYDRO}'@'localhost';




FLUSH PRIVILEGES;
    
EOF

$MYSQL -u root -p"$MYSQL_ROOT_PASSWORD"< user.sql







modify_param_in_mysqld() {
  local param="$1"
  local value="$2"

  if [ "$param" = "plugin_load_add" ]; then
    # Si es plugin_load_add, añadir la línea si no existe exactamente
    if ! grep -q "^$param = $value" "$CONF_FILE"; then
      sed -i "/^\[mysqld\]/a $param = $value" "$CONF_FILE"
    fi
  else
    # Para parámetros normales: modificar o insertar
    if awk -v param="$param" '
      $0 ~ /^\[mysqld\]/ { in_section=1; next }
      /^\[/ { in_section=0 }
      in_section && $1 == param { found=1; exit }
      END { exit !found }
    ' "$CONF_FILE"; then
      sed -i "/^\[mysqld\]/,/^\[/{ 
        s/^$param.*/$param = $value/
      }" "$CONF_FILE"
    else
      sed -i "/^\[mysqld\]/a $param = $value" "$CONF_FILE"
    fi
  fi
}
# ======================
# Configurar políticas de contraseña seguras
# ======================
modify_param_in_mysqld "event_scheduler" "ON"





modify_param_in_mysqld "simple_password_check" "FORCE"

modify_param_in_mysqld "simple_password_check_other_characters" "0"


modify_param_in_mysqld "simple_password_check_minimal_length" "12"
modify_param_in_mysqld "simple_password_check_letters_same_case" "1"
modify_param_in_mysqld "simple_password_check_digits" "2"


modify_param_in_mysqld "password_reuse_check_interval"  "90";
modify_param_in_mysqld "plugin_load_add" "password_reuse_check"
modify_param_in_mysqld "plugin_load_add" "simple_password_check"

# Usar función para bind-address y port


modify_param_in_mysqld "port" "$DB_PORT"
modify_param_in_mysqld "bind-address" "$DB_IP"
modify_param_in_mysqld "sql_mode" "STRICT_ALL_TABLES"


#modify_param_in_mysqld "default_time_zone" "+00:00"






systemctl enable mariadb


systemctl restart mariadb
systemctl status mariadb




echo -e "\e[32mMySQL asegurado correctamente.\e[0m"

$MYSQL -u root -p"$MYSQL_ROOT_PASSWORD"< files/db/hydrosyn/db1_config_groups.sql  2>> errores.txt

python3 -c "
from zoneinfo import  available_timezones



with open('timezones.sql', 'w') as f:
    f.write('USE $DB_NAME;\n')
    f.write('INSERT INTO timezones (name) VALUES\n')
    
    values = []
    for tz_name in sorted(available_timezones()):
        tz_name_escaped = tz_name.replace(\"'\", \"\\\\'\")  # Escapar comillas para SQL
        values.append(f\"('{tz_name_escaped}')\")
    
    f.write(',\\n'.join(values) + ';\\n')
"
$MYSQL -u root -p"$MYSQL_ROOT_PASSWORD"< timezones.sql 2>> errores.txt

$MYSQL -u root -p"$MYSQL_ROOT_PASSWORD"< files/db/hydrosyn/db2_notifications.sql  2>> errores.txt

$MYSQL -u root -p"$MYSQL_ROOT_PASSWORD"< files/db/hydrosyn/db3_config.sql  2>> errores.txt

$MYSQL -u root -p"$MYSQL_ROOT_PASSWORD"< files/db/hydrosyn/db4_users.sql  2>> errores.txt



$MYSQL -u root -p"$MYSQL_ROOT_PASSWORD"< files/db/hydrosyn/db5_config_history.sql  2>> errores.txt

$MYSQL -u root -p"$MYSQL_ROOT_PASSWORD"< files/db/hydrosyn/db6_notifications_history.sql  2>> errores.txt

$MYSQL -u root -p"$MYSQL_ROOT_PASSWORD"< files/db/hydrosyn/db7_permissions_tables.sql  2>> errores.txt

# Generar hash bcrypt con Python

HASH_PASS=$(python3 -c "
from argon2 import PasswordHasher
ph = PasswordHasher()
print(ph.hash('$FIRST_USER_PASSWORD'))
")
#HASH_PASS=$(python3 -c "
#import bcrypt
#password = b'$FIRST_USER_PASSWORD'
#hashed = bcrypt.hashpw(password, bcrypt.gensalt())
#")

# SQL para crear el primer usuario admin
SQL="
USE hydrosyn_db;

INSERT INTO users (
     username, email, password, is_active,
    change_pass, delete_possible,
    created_by, language, theme, use_2fa, twofa_secret, fa_verified, first_login
)
VALUES (
     '$FIRST_USER', '$FIRST_USER_EMAIL', '$HASH_PASS', TRUE,
    FALSE, FALSE,
    1, 'en', 'light', FALSE, NULL, FALSE, TRUE
);

INSERT INTO user_roles (
    user_id, role_id, created_by
) VALUES (
    2, 1, 1
);

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
