#!/bin/bash

# Chat Application - Oracle Cloud Always Free Deployment Setup Script
# Run this script on your Oracle Cloud Ubuntu instance

set -e  # Exit on error

echo "=============================================="
echo "Chat App - Oracle Cloud Setup Script"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}User: $(whoami)${NC}"
echo -e "${BLUE}System: $(lsb_release -d | cut -f2)${NC}"
echo -e "${BLUE}IP Address: $(hostname -I | awk '{print $1}')${NC}"
echo ""

echo -e "${YELLOW}Step 1: Configuring Ubuntu Firewall (iptables)${NC}"
echo "Oracle Cloud blocks ports by default. Opening ports 80 and 443..."

# Open HTTP and HTTPS ports
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT

# Install iptables-persistent to save rules
echo "Installing iptables-persistent..."
echo iptables-persistent iptables-persistent/autosave_v4 boolean true | sudo debconf-set-selections
echo iptables-persistent iptables-persistent/autosave_v6 boolean true | sudo debconf-set-selections
sudo apt-get install -y iptables-persistent

echo -e "${GREEN}✓ Firewall configured${NC}"
echo ""

echo -e "${YELLOW}Step 2: Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y
echo -e "${GREEN}✓ System updated${NC}"
echo ""

echo -e "${YELLOW}Step 3: Installing Node.js 20.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
echo -e "${GREEN}✓ Node.js installed: $(node --version)${NC}"
echo ""

echo -e "${YELLOW}Step 4: Installing Nginx...${NC}"
sudo apt install -y nginx
echo -e "${GREEN}✓ Nginx installed${NC}"
echo ""

echo -e "${YELLOW}Step 5: Installing Certbot (SSL)...${NC}"
sudo apt install -y certbot python3-certbot-nginx
echo -e "${GREEN}✓ Certbot installed${NC}"
echo ""

echo -e "${YELLOW}Step 6: Installing PM2...${NC}"
sudo npm install -g pm2
echo -e "${GREEN}✓ PM2 installed: $(pm2 --version)${NC}"
echo ""

echo -e "${YELLOW}Step 7: Installing Git...${NC}"
sudo apt install -y git
echo -e "${GREEN}✓ Git installed${NC}"
echo ""

echo -e "${YELLOW}Step 8: Creating application directory...${NC}"
sudo mkdir -p /var/www/chat-app
sudo chown -R $(whoami):$(whoami) /var/www/chat-app
echo -e "${GREEN}✓ Directory created: /var/www/chat-app${NC}"
echo ""

echo -e "${GREEN}=============================================="
echo "✓ Installation Complete!"
echo "==============================================${NC}"
echo ""
echo -e "${BLUE}Installed Versions:${NC}"
echo -e "  Node.js: ${GREEN}$(node --version)${NC}"
echo -e "  NPM: ${GREEN}$(npm --version)${NC}"
echo -e "  Nginx: ${GREEN}$(nginx -v 2>&1 | cut -d'/' -f2)${NC}"
echo -e "  PM2: ${GREEN}$(pm2 --version)${NC}"
echo -e "  Git: ${GREEN}$(git --version | cut -d' ' -f3)${NC}"
echo -e "  Certbot: ${GREEN}$(certbot --version | cut -d' ' -f2)${NC}"
echo ""
echo -e "${BLUE}Firewall Status:${NC}"
sudo iptables -L INPUT -n --line-numbers | grep -E "80|443" || echo "  (Checking...)"
echo ""
echo -e "${YELLOW}=============================================="
echo "Next Steps:"
echo "==============================================${NC}"
echo ""
echo -e "${BLUE}1. Clone your backend code:${NC}"
echo "   cd /var/www/chat-app"
echo "   git clone YOUR_REPO_URL ."
echo ""
echo -e "${BLUE}2. Create .env file:${NC}"
echo "   nano /var/www/chat-app/.env"
echo "   (Add PORT and MONGODB_URI)"
echo ""
echo -e "${BLUE}3. Install and start:${NC}"
echo "   cd /var/www/chat-app"
echo "   npm install"
echo "   pm2 start index.js --name chat-server"
echo "   pm2 startup systemd"
echo "   pm2 save"
echo ""
echo -e "${BLUE}4. Configure Nginx:${NC}"
echo "   See DEPLOYMENT_ORACLE.md for config"
echo ""
echo -e "${BLUE}5. Setup SSL:${NC}"
echo "   sudo certbot --nginx -d yourdomain.duckdns.org"
echo ""
echo -e "${GREEN}For detailed instructions, see DEPLOYMENT_ORACLE.md${NC}"
echo ""
echo -e "${YELLOW}=============================================="
echo "Oracle Cloud Specific Notes:"
echo "==============================================${NC}"
echo ""
echo "1. Firewall ports 80 and 443 are now open"
echo "2. Make sure Oracle Cloud Security List also allows these ports"
echo "3. Your public IP: $(hostname -I | awk '{print $1}')"
echo "4. Update DuckDNS with this IP address"
echo ""
echo -e "${GREEN}Happy deploying! 🚀${NC}"
echo ""
