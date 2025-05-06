#!/bin/bash

# Actualizar el sistema
echo "Actualizando el sistema..."
 apt update && sudo apt upgrade -y

# Instalar MariaDB
echo "Instalando MariaDB..."
 apt install mariadb-server mariadb-client -y

# Verificar si MariaDB está corriendo
echo "Verificando el estado de MariaDB..."
systemctl status mariadb

# Habilitar MariaDB para que inicie al arrancar
echo "Habilitando MariaDB para que inicie al arrancar..."
sudo systemctl enable mariadb

# Iniciar el servicio de MariaDB si no está en ejecución
echo "Iniciando MariaDB..."
sudo systemctl start mariadb

# Configurar MariaDB para mayor seguridad
echo "Configurando seguridad en MariaDB..."
sudo mysql_secure_installation

# Instalar mariadb-backup (si no está instalado)
echo "Instalando mariadb-backup..."
sudo apt install mariadb-backup -y

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
