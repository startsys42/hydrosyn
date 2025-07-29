#!/bin/bash


 apt update -y

 
ins-paq ca-certificates curl gnupg lsb-release

mkdir -m 0700 -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | \
 gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo \
"deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/debian \
$(lsb_release -cs) stable" | \
 tee /etc/apt/sources.list.d/docker.list > /dev/null

 apt update -y
ins-paq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin




if [ -f "$DAEMON_JSON" ]; then
   
   cp "$DAEMON_JSON" "${DAEMON_JSON}.bak"
fi

 tee "$DAEMON_JSON" > /dev/null <<EOF
{
  "log-driver": "json-file"
}
EOF






 tee "$LOGROTATE_CONF" > /dev/null <<EOF
/var/lib/docker/containers/*/*.log {
    daily
    rotate 30

    missingok
   
    copytruncate
    notifempty
}
EOF



docker --version
systemctl restart docker
 systemctl enable docker

git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker
cp .env.example .env