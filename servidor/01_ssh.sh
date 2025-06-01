
#!/bin/bash
COLOR_BG_IMPAR="46"
COLOR_BG_PAR="43"



apt-get update -y > /dev/null
apt-get upgrade -y > /dev/null

ins-paq install libpam-google-authenticator
if [ $? -ne 0 ]; then
 
    exit 1
fi


ins-paq openssh-server 
if [ $? -ne 0 ]; then
 
    exit 1
fi
ins-paq openssh-client
if [ $? -ne 0 ]; then
 
    exit 1
fi



cat <<EOF > /etc/ssh/ssh_config
# Configuración segura para cliente SSH

Host *
    Protocol 2
    ForwardAgent no
    ForwardX11 no
    ForwardX11Trusted no
    PasswordAuthentication no #solo autenticacion con clave publica
    PubkeyAuthentication yes
    HostbasedAuthentication no
    StrictHostKeyChecking ask
    UserKnownHostsFile ~/.ssh/known_hosts
    LogLevel VERBOSE
    TCPKeepAlive yes
    ServerAliveInterval 60
    ServerAliveCountMax 3
    HashKnownHosts yes
    
EOF


cat <<EOF > /etc/ssh/sshd_config
# Configuración segura para servidor SSH

Port 3748
Protocol 2
PermitRootLogin no
PasswordAuthentication no
ChallengeResponseAuthentication yes
AuthenticationMethods publickey,keyboard-interactive
UsePAM yes
AllowTcpForwarding no
X11Forwarding no
MaxAuthTries 3
MaxSessions 2
LoginGraceTime 30
ClientAliveInterval 60
ClientAliveCountMax 3
PermitEmptyPasswords no
AllowUsers tu_usuario
Banner /etc/issue.net
LogLevel VERBOSE
SyslogFacility AUTHPRIV
AuthorizedKeysCommand /usr/local/bin/authorized_keys_filter.sh
AuthorizedKeysCommandUser root

# Cifrados seguros
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes256-ctr
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com

# Claves permitidas
HostKey /etc/ssh/ssh_host_ed25519_key
HostKey /etc/ssh/ssh_host_rsa_key

PubkeyAcceptedAlgorithms rsa-sha2-512,rsa-sha2-256,ssh-ed25519
EOF


cat << 'EOF' > /usr/local/bin/authorized_keys_filter.sh
#!/bin/bash

USUARIO="$1"
AUTH_KEYS_FILE="/home/$USUARIO/.ssh/authorized_keys"

# Si no existe el archivo, salir con éxito (sin claves)
if [[ ! -f "$AUTH_KEYS_FILE" ]]; then
  exit 0
fi

while read -r linea; do
  # Saltar líneas vacías o comentarios
  [[ -z "$linea" || "$linea" =~ ^# ]] && continue

  # Extraer tipo y clave base64
  tipo=$(echo "$linea" | awk '{print $1}')
  clave=$(echo "$linea" | awk '{print $2}')

  if [[ "$tipo" == "ssh-rsa" ]]; then
    # Decodificar clave base64 y obtener longitud en bits
    clave_bin=$(echo "$clave" | base64 -d 2>/dev/null)
    longitud=$(echo "$clave_bin" | ssh-keygen -lf /dev/stdin 2>/dev/null | awk '{print $1}')

    if [[ "$longitud" -ge 2048 ]]; then
      echo "$linea"
    fi
  else
    # Aceptar otros tipos sin filtro
    echo "$linea"
  fi
done < "$AUTH_KEYS_FILE"
EOF

# Cambiar propietario, grupo y permisos
chown root:root /usr/local/bin/authorized_keys_filter.sh
chmod 700 /usr/local/bin/authorized_keys_filter.sh



if ! grep -q 'pam_google_authenticator.so' /etc/pam.d/sshd; then
  echo 'auth required pam_google_authenticator.so' >> /etc/pam.d/sshd
fi


# Establecer propietario y grupo a root para ambos archivos
chown root:root /etc/ssh/ssh_config
chown root:root /etc/ssh/sshd_config



chmod 644 /etc/ssh/ssh_config


chmod 600 /etc/ssh/sshd_config


# Si existe el archivo /etc/issue.net 
if [ -f /etc/issue.net ]; then
    echo "$ISSUE" > /etc/issue.net
else
   "\e[30;42mNo se ha encontrado el archivo /etc/issue.net.\e[0m"
fi

# Si existe el archivo /etc/motd 
if [ -f /etc/motd  ]; then
    echo "$BANNER" > /etc/motd 
else
   "\e[30;42mNo se ha encontrado el archivo /etc/motd .\e[0m"
fi

ssh-keygen -t rsa -b 4096 -f /etc/ssh/ssh_host_rsa_key -N ""


systemctl enable ssh


systemctl start ssh




# Verificar que el servicio SSH esté corriendo

systemctl status ssh


echo "¡SSH Server y Client instalados y configurados correctamente!"
# sshh audit ssh guard

ins-paq ssh-audit
if [ $? -ne 0 ]; then
    exit 1
fi

ins-paq sshguard
if [ $? -ne 0 ]; then
    exit 1
fi




#certificados falta activar el google 2fa y el audit 
