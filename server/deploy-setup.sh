#!/bin/bash

# Chat Application - DigitalOcean Deployment Setup Script
# Run this script on your DigitalOcean droplet as root

set -e  # Exit on error

echo "======================================"
echo "Chat App - Server Setup Script"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (use: sudo bash deploy-setup.sh)"
    exit 1
fi

echo -e "${GREEN}Step 1: Updating system...${NC}"
apt update && apt upgrade -y

echo -e "${GREEN}Step 2: Installing Node.js 20.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo -e "${GREEN}Step 3: Installing Nginx...${NC}"
apt install -y nginx

echo -e "${GREEN}Step 4: Installing Certbot for SSL...${NC}"
apt install -y certbot python3-certbot-nginx

echo -e "${GREEN}Step 5: Installing PM2 globally...${NC}"
npm install -g pm2

echo -e "${GREEN}Step 6: Installing Git...${NC}"
apt install -y git

echo -e "${GREEN}Step 7: Setting up firewall...${NC}"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo ""
echo -e "${GREEN}Step 8: Creating application directory...${NC}"
mkdir -p /var/www/chat-app
cd /var/www/chat-app

echo ""
echo -e "${YELLOW}======================================"
echo "Installation Complete!"
echo "======================================${NC}"
echo ""
echo "Installed versions:"
echo "  Node.js: $(node --version)"
echo "  NPM: $(npm --version)"
echo "  Nginx: $(nginx -v 2>&1)"
echo "  PM2: $(pm2 --version)"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Clone or upload your backend code to: /var/www/chat-app"
echo "   Example: git clone YOUR_REPO_URL /var/www/chat-app"
echo ""
echo "2. Create .env file with your MongoDB credentials"
echo "   Example: nano /var/www/chat-app/.env"
echo ""
echo "3. Install dependencies: npm install"
echo ""
echo "4. Start server with PM2: pm2 start index.js --name chat-server"
echo ""
echo "5. Configure Nginx (see DEPLOYMENT.md for config)"
echo ""
echo "6. Set up SSL: certbot --nginx -d yourdomain.duckdns.org"
echo ""
echo -e "${GREEN}For detailed instructions, see DEPLOYMENT.md${NC}"
