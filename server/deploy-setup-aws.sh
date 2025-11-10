#!/bin/bash

# Chat Application - AWS EC2 Deployment Setup Script
# Run this script on your AWS EC2 Ubuntu instance

set -e  # Exit on error

echo "======================================"
echo "Chat App - AWS EC2 Setup Script"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Detected User: $(whoami)${NC}"
echo -e "${BLUE}System: $(lsb_release -d | cut -f2)${NC}"
echo ""

echo -e "${GREEN}Step 1: Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

echo ""
echo -e "${GREEN}Step 2: Installing Node.js 20.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

echo ""
echo -e "${GREEN}Step 3: Installing Nginx (reverse proxy)...${NC}"
sudo apt install -y nginx

echo ""
echo -e "${GREEN}Step 4: Installing Certbot (SSL certificates)...${NC}"
sudo apt install -y certbot python3-certbot-nginx

echo ""
echo -e "${GREEN}Step 5: Installing PM2 (process manager)...${NC}"
sudo npm install -g pm2

echo ""
echo -e "${GREEN}Step 6: Installing Git...${NC}"
sudo apt install -y git

echo ""
echo -e "${GREEN}Step 7: Creating application directory...${NC}"
sudo mkdir -p /var/www/chat-app
sudo chown -R $(whoami):$(whoami) /var/www/chat-app

echo ""
echo -e "${GREEN}Step 8: Configuring firewall (ufw)...${NC}"
# AWS uses Security Groups, but we'll configure ufw as an extra layer
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
echo "y" | sudo ufw enable

echo ""
echo -e "${GREEN}✓ Installation Complete!${NC}"
echo ""
echo -e "${YELLOW}======================================"
echo "Installed Versions:"
echo "======================================${NC}"
echo -e "  Node.js: ${GREEN}$(node --version)${NC}"
echo -e "  NPM: ${GREEN}$(npm --version)${NC}"
echo -e "  Nginx: ${GREEN}$(nginx -v 2>&1)${NC}"
echo -e "  PM2: ${GREEN}$(pm2 --version)${NC}"
echo -e "  Git: ${GREEN}$(git --version | cut -d' ' -f3)${NC}"
echo ""
echo -e "${YELLOW}======================================"
echo "Next Steps:"
echo "======================================${NC}"
echo ""
echo -e "${BLUE}1. Clone or upload your backend code:${NC}"
echo "   cd /var/www/chat-app"
echo "   git clone YOUR_REPO_URL ."
echo ""
echo -e "${BLUE}2. Create .env file with MongoDB credentials:${NC}"
echo "   nano /var/www/chat-app/.env"
echo ""
echo -e "${BLUE}3. Install dependencies:${NC}"
echo "   cd /var/www/chat-app"
echo "   npm install"
echo ""
echo -e "${BLUE}4. Start server with PM2:${NC}"
echo "   pm2 start index.js --name chat-server"
echo "   pm2 startup systemd"
echo "   pm2 save"
echo ""
echo -e "${BLUE}5. Configure Nginx:${NC}"
echo "   See DEPLOYMENT_AWS.md for Nginx configuration"
echo ""
echo -e "${BLUE}6. Setup SSL certificate:${NC}"
echo "   sudo certbot --nginx -d yourdomain.duckdns.org"
echo ""
echo -e "${GREEN}For detailed instructions, see DEPLOYMENT_AWS.md${NC}"
echo ""
