
#!/bin/bash
COLOR_BG_ODD="46"
COLOR_BG_EVEN="43"



apt-get update -y > /dev/null
apt-get upgrade -y > /dev/null

ins-paq libpam-google-authenticator



ins-paq openssh-server 

ins-paq openssh-client




cat <<EOF > /etc/ssh/ssh_config


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
# SERVER

Port $SSH_PORT
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
AllowUsers $USER 
Banner /etc/issue.net
LogLevel VERBOSE
SyslogFacility AUTHPRIV
AuthorizedKeysCommand /usr/local/bin/authorized_keys_filter.sh
AuthorizedKeysCommandUser root


Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes256-ctr
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com

HostKey /etc/ssh/ssh_host_ed25519_key
HostKey /etc/ssh/ssh_host_rsa_key

PubkeyAcceptedAlgorithms rsa-sha2-512,rsa-sha2-256,ssh-ed25519
EOF


cat << EOF > /usr/local/bin/authorized_keys_filter.sh
#!/bin/bash

USER="\$1"
AUTH_KEYS_FILE="/home/\$USER/.ssh/authorized_keys"


if [[ ! -f "\$AUTH_KEYS_FILE" ]]; then
  exit 0
fi


while read -r line; do

  [[ -z "\$line" || "\$line" =~ ^# ]] && continue


  type=\$(echo "\$line" | cut -d ' ' -f1)
  key=\$(echo "\$line" | cut -d ' ' -f2)

 # If the key type is ssh-rsa, verify that it has at least 2048 bits

  if [[ "\$type" == "ssh-rsa" ]]; then
    # Decode the base64 key
    key_bin=\$(echo "\$key" | base64 -d 2>/dev/null)

    # If it could not be decoded, skip this line

    if [[ -z "\$key_bin" ]]; then
      continue
    fi

 
  # Get the key length in bits
    length=\$(echo "\$key_bin" | ssh-keygen -lf /dev/stdin 2>/dev/null | awk '{print \$1}')

    # If the key is at least 2048 bits, accept it
    if [[ "\$length" -ge 2048 ]]; then
  
    fi
  

  fi
done < "\$AUTH_KEYS_FILE"

EOF

# Change owner, group, and permissions
chown root:root /usr/local/bin/authorized_keys_filter.sh
chmod 700 /usr/local/bin/authorized_keys_filter.sh

LINE="auth required pam_google_authenticator.so"

# PAM sshd file
PAM_FILE="/etc/pam.d/sshd"

# Check if the line already exists to avoid duplicates
if ! grep -Fxq "$LINE" "$PAM_FILE"; then
  # Insert the line at the beginning of the file
  sed -i "1i $LINE" "$PAM_FILE"
  echo "Line added to $PAM_FILE"
else
  echo "The line is already present in $PAM_FILE"
fi

su - $USER -c "google-authenticator -t -f -r 3 -R 30 -w 3 -Q UTF8"




chown root:root /etc/ssh/ssh_config
chown root:root /etc/ssh/sshd_config



chmod 644 /etc/ssh/ssh_config


chmod 600 /etc/ssh/sshd_config


# If the file /etc/issue.net exists
if [ -f /etc/issue.net ]; then
    echo "$ISSUE" > /etc/issue.net
else
   echo -e "\e[30;41mFile /etc/issue.net not found.\e[0m"
fi

# If the file /etc/motd exists
if [ -f /etc/motd ]; then
    echo "$BANNER" > /etc/motd
else
   echo -e "\e[30;41mFile /etc/motd not found.\e[0m"
fi


rm -f /etc/ssh/ssh_host_rsa_key /etc/ssh/ssh_host_rsa_key.pub
ssh-keygen -t rsa -b 4096 -f /etc/ssh/ssh_host_rsa_key -N ""


systemctl enable ssh


systemctl restart ssh






systemctl status ssh



# sshh audit ssh guard

ins-paq ssh-audit
ssh-audit localhost
apt-get purge ssh-audit
ins-paq sshguard


 systemctl restart sshguard
 systemctl enable sshguard




