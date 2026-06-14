#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y ca-certificates curl gnupg postgresql postgresql-contrib

install -d -m 0755 /etc/apt/keyrings
if [ ! -f /etc/apt/keyrings/nodesource.gpg ]; then
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
fi

echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" > /etc/apt/sources.list.d/nodesource.list
apt-get update
apt-get install -y nodejs

if ! id -u maxpush >/dev/null 2>&1; then
  useradd --system --home /opt/maxpush --shell /usr/sbin/nologin maxpush
fi

install -d -o maxpush -g maxpush -m 0755 /opt/maxpush
install -d -o maxpush -g maxpush -m 0755 /var/lib/maxpush
install -d -o root -g maxpush -m 0750 /etc/maxpush
install -d -o root -g root -m 0755 /var/www/notifymax/.well-known/acme-challenge

systemctl enable postgresql
systemctl start postgresql

node -v
npm -v
systemctl is-active postgresql
