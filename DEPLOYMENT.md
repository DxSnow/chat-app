# Deployment Guide - Chat Application

This guide walks you through deploying your chat application using DuckDNS (free domain) and Oracle Cloud (both frontend and backend).

## Architecture Overview

- **Frontend + Backend**: Deployed on Oracle Cloud VM (FREE tier)
- **Database**: MongoDB Atlas (FREE tier)
- **Domain**: DuckDNS (FREE subdomain)
- **SSL**: Let's Encrypt via Nginx (FREE)

---

## Step 1: Get Your DuckDNS Domain

1. Go to https://www.duckdns.org
2. Sign in with GitHub/Google/Reddit/Twitter
3. Enter your desired subdomain name (e.g., `chachachat`)
4. Click "add domain"
5. **Save your token** - you'll need it later
6. Your domain: `yourname.duckdns.org`

---

## Step 2: Create Oracle Cloud VM

### 2.1 Create Account
1. Go to https://www.oracle.com/cloud/free/
2. Sign up for Oracle Cloud Free Tier
3. Add payment method (won't be charged for free tier)

### 2.2 Create Compute Instance
1. Go to Compute → Instances → Create Instance
2. **Choose Image**: Ubuntu 22.04 (Canonical)
3. **Choose Shape**: VM.Standard.E2.1.Micro (Always Free eligible)
4. **Choose Region**: Closest to your users
5. **Authentication**: Add your SSH public key
6. **Hostname**: `chat-server`
7. Click "Create"
8. **Save your instance's public IP address** (e.g., `164.123.45.67`)

---

## Step 3: Configure DuckDNS to Point to Your Server

1. Go back to https://www.duckdns.org
2. You should see your domain listed
3. In the "current ip" field, paste your **Oracle Cloud instance IP**
4. Click "update ip"
5. Test: Open terminal and run:
   ```bash
   ping yourname.duckdns.org
   ```
   You should see your instance's IP address

---

## Step 4: Deploy to Oracle Cloud

### 4.1 SSH into Your Instance

```bash
ssh ubuntu@yourname.duckdns.org
# Or use: ssh ubuntu@YOUR_INSTANCE_IP
```

### 4.2 Install Node.js and Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx (for reverse proxy and SSL)
sudo apt install -y nginx

# Install Certbot (for SSL certificates)
sudo apt install -y certbot python3-certbot-nginx

# Install PM2 (process manager to keep your app running)
sudo npm install -g pm2

# Verify installations
node --version
npm --version
nginx -v
```

### 4.3 Set Up Your Application

```bash
# Create app directory
sudo mkdir -p /var/www/chat-app
sudo chown ubuntu:ubuntu /var/www/chat-app
cd /var/www/chat-app

# Clone your code from GitHub
git clone YOUR_GITHUB_REPO_URL .

# Or use SCP from your local machine:
# scp -r /path/to/chat-app/* ubuntu@yourname.duckdns.org:/var/www/chat-app/
```

### 4.4 Build Frontend

```bash
cd /var/www/chat-app/client
npm install
npm run build
```

### 4.5 Configure Backend Environment Variables

```bash
cd /var/www/chat-app/server

# Create .env file
nano .env
```

Paste this (replace with your values):
```env
PORT=3001
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-secret-key-here
ADMIN_TOKEN=your-admin-token-here
```

Press `Ctrl+X`, then `Y`, then `Enter` to save.

### 4.6 Install Backend Dependencies and Start Server

```bash
cd /var/www/chat-app/server
npm install

# Start with PM2
pm2 start index.js --name chat-server

# Set PM2 to start on system reboot
pm2 startup systemd
pm2 save

# Check status
pm2 status
pm2 logs chat-server
```

### 4.7 Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/chat-app
```

Paste this configuration (replace `yourname.duckdns.org`):

```nginx
server {
    listen 80;
    server_name yourname.duckdns.org;

    # Frontend - serve static files
    location / {
        root /var/www/chat-app/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/chat-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4.8 Set Up SSL Certificate (HTTPS)

```bash
# Get SSL certificate from Let's Encrypt
sudo certbot --nginx -d yourname.duckdns.org

# Follow prompts:
# - Enter email
# - Agree to terms
# - Choose to redirect HTTP to HTTPS (option 2)

# Set up auto-renewal
sudo certbot renew --dry-run
```

---

## Step 5: Test Your Deployment

1. Visit your domain: `https://yourname.duckdns.org`
2. Register an account
3. Login and send messages
4. Open in another browser/incognito and test real-time chat
5. Check messages persist (MongoDB)

---

## Maintenance Commands

### On Oracle Cloud Server

```bash
# View logs
pm2 logs chat-server

# Restart server
pm2 restart chat-server

# Stop server
pm2 stop chat-server

# Update code (backend)
cd /var/www/chat-app/server
git pull
npm install
pm2 restart chat-server

# Update frontend
cd /var/www/chat-app/client
git pull
npm install
npm run build
# No restart needed - Nginx serves static files

# Renew SSL certificate
sudo certbot renew
```

---

## Troubleshooting

### Backend not accessible
```bash
# Check if server is running
pm2 status

# Check nginx
sudo systemctl status nginx

# Check firewall (Oracle Cloud uses iptables)
sudo iptables -L -n
```

### WebSocket connection failing
- Ensure Nginx WebSocket config is correct
- Check SSL certificate is working (wss:// requires HTTPS)
- Verify PM2 server is running

### MongoDB connection issues
- Check .env file has correct MONGODB_URI
- Verify MongoDB Atlas allows connections from your instance IP
  - Go to MongoDB Atlas → Network Access → Add IP Address → Add your Oracle Cloud instance IP

### 502 Bad Gateway
```bash
# Check PM2 logs for errors
pm2 logs chat-server

# Common fix: reinstall dependencies
cd /var/www/chat-app/server
npm install
pm2 restart chat-server
```

---

## Cost Summary

- DuckDNS: **FREE**
- MongoDB Atlas: **FREE** (512MB)
- SSL Certificate: **FREE** (Let's Encrypt)
- Oracle Cloud VM: **FREE** (Always Free tier)

**Total: FREE**

---

## Admin Features

### List all registered users
```bash
curl -H "x-admin-token: YOUR_ADMIN_TOKEN" https://yourname.duckdns.org/api/auth/admin/users
```

### Delete a user
```bash
curl -X DELETE -H "x-admin-token: YOUR_ADMIN_TOKEN" https://yourname.duckdns.org/api/auth/admin/users/USER_ID
```

---

## Need Help?

If you get stuck at any step, check:
1. PM2 logs: `pm2 logs chat-server`
2. Nginx logs: `tail -f /var/log/nginx/error.log`
