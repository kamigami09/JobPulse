#!/usr/bin/env bash
# JobPulse VPS setup script — run once on a fresh Ubuntu 26.04 server as root.
# Idempotent: safe to re-run after updates.
set -euo pipefail

REPO_URL="https://github.com/kamigami09/JobPulse.git"
BACKEND_DIR="/var/www/jobpulse-backend"
FRONTEND_DIST="/var/www/jobpulse"
LOG_DIR="/var/log/jobpulse"
SERVICE_NAME="jobpulse"

echo "==> [1/10] Updating packages and installing system dependencies"
apt-get update -qq
apt-get install -y -qq \
    git curl wget \
    python3 python3-venv python3-pip python3-dev \
    build-essential \
    postgresql postgresql-contrib \
    nginx \
    ufw \
    nodejs npm

# Install Chromium for Selenium (Layer 2 scraper)
apt-get install -y -qq chromium-browser 2>/dev/null || \
    apt-get install -y -qq chromium 2>/dev/null || \
    echo "WARN: chromium not found — Layer 2 scraper (LI_AT) will be unavailable"

echo "==> [2/10] Starting PostgreSQL"
systemctl enable postgresql --quiet
systemctl start postgresql

echo "==> [3/10] Creating PostgreSQL user and database"
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='jobpulse'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE USER jobpulse WITH PASSWORD 'jobpulse';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='jobpulse'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE DATABASE jobpulse OWNER jobpulse;"

echo "==> [4/10] Cloning / updating repository"
if [ -d "$BACKEND_DIR/.git" ]; then
    git -C "$BACKEND_DIR" pull --ff-only
else
    git clone "$REPO_URL" "$BACKEND_DIR"
fi

echo "==> [5/10] Setting up .env file"
ENV_FILE="$BACKEND_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
    SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")
    cat > "$ENV_FILE" <<ENVEOF
DATABASE_URL=postgresql://jobpulse:jobpulse@localhost:5432/jobpulse
LI_AT_COOKIE=
FLASK_ENV=production
SECRET_KEY=${SECRET}
ENVEOF
    echo "  Created $ENV_FILE — add your LI_AT_COOKIE if you want LinkedIn layer-2 scraping."
else
    echo "  $ENV_FILE already exists, skipping."
fi

echo "==> [6/10] Installing Python dependencies"
cd "$BACKEND_DIR"
python3 -m venv venv
venv/bin/pip install --quiet --upgrade pip
venv/bin/pip install --quiet -r requirements.txt

echo "==> [7/10] Running database migrations"
FLASK_APP=run.py venv/bin/flask db upgrade

echo "==> [8/10] Building React frontend"
cd "$BACKEND_DIR/frontend" 2>/dev/null || cd "$(dirname "$BACKEND_DIR")/frontend" 2>/dev/null || {
    # Try to find frontend relative to the cloned repo
    cd "$BACKEND_DIR/../frontend" 2>/dev/null || true
}
# Detect frontend location inside cloned repo
FRONTEND_SRC="$BACKEND_DIR/../frontend"
if [ -f "$BACKEND_DIR/frontend/package.json" ]; then
    FRONTEND_SRC="$BACKEND_DIR/frontend"
fi
if [ -f "$FRONTEND_SRC/package.json" ]; then
    cd "$FRONTEND_SRC"
    npm install --silent
    VITE_API_URL="" npm run build
    mkdir -p "$FRONTEND_DIST"
    cp -r dist/. "$FRONTEND_DIST/"
    echo "  Frontend built → $FRONTEND_DIST"
else
    echo "  WARN: frontend not found at $FRONTEND_SRC — skipping build"
fi

echo "==> [9/10] Configuring Nginx"
mkdir -p "$FRONTEND_DIST"
cp "$BACKEND_DIR/deploy/nginx.conf" /etc/nginx/sites-available/jobpulse
ln -sf /etc/nginx/sites-available/jobpulse /etc/nginx/sites-enabled/jobpulse
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx --quiet
systemctl reload nginx

echo "==> [10/10] Installing and starting systemd service"
mkdir -p "$LOG_DIR"
chown www-data:www-data "$LOG_DIR"
chown -R www-data:www-data "$BACKEND_DIR" "$FRONTEND_DIST"
cp "$BACKEND_DIR/deploy/jobpulse.service" /etc/systemd/system/jobpulse.service
systemctl daemon-reload
systemctl enable jobpulse --quiet
systemctl restart jobpulse

echo ""
echo "==> Configuring firewall"
ufw allow 22/tcp  --quiet 2>/dev/null || true
ufw allow 80/tcp  --quiet 2>/dev/null || true
ufw --force enable 2>/dev/null || true

echo ""
echo "============================================"
echo "  JobPulse setup complete!"
echo "  App:    http://$(hostname -I | awk '{print $1}')"
echo "  Health: http://$(hostname -I | awk '{print $1}')/health"
echo "  Logs:   journalctl -u jobpulse -f"
echo "============================================"
