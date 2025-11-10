# Deployment Guide - Chat Application

This guide will walk you through deploying your chat application using DuckDNS (free domain) and DigitalOcean (backend) + Vercel (frontend).

## Architecture Overview

- **Frontend**: Deployed on Vercel (FREE)
- **Backend**: Deployed on DigitalOcean Droplet ($4-6/month)
- **Database**: MongoDB Atlas (Already configured, FREE tier)
- **Domain**: DuckDNS (FREE subdomain)
- **SSL**: Let's Encrypt via Nginx (FREE)

---

## Step 1: Get Your DuckDNS Domain

1. Go to https://www.duckdns.org
2. Sign in with GitHub/Google/Reddit/Twitter
3. Enter your desired subdomain name (e.g., `snowchat`)
4. Click "add domain"
5. **Save your token** - you'll need it later
6. Your domain: `yourname.duckdns.org`

---

## Step 2: Create DigitalOcean Droplet

### 2.1 Create Account
1. Go to https://www.digitalocean.com
2. Sign up (get $200 credit for 60 days)
3. Add payment method

### 2.2 Create Droplet
1. Click "Create" → "Droplets"
2. **Choose Image**: Ubuntu 22.04 LTS
3. **Choose Plan**: Basic ($4/month - 512MB RAM)
4. **Choose Region**: Closest to your users
5. **Authentication**: SSH Key (recommended) or Password
6. **Hostname**: `chat-server`
7. Click "Create Droplet"
8. **Save your droplet's IP address** (e.g., `164.123.45.67`)

---

## Step 3: Configure DuckDNS to Point to Your Server

1. Go back to https://www.duckdns.org
2. You should see your domain listed
3. In the "current ip" field, paste your **DigitalOcean droplet IP**
4. Click "update ip"
5. Test: Open terminal and run:
   ```bash
   ping yourname.duckdns.org
   ```
   You should see your droplet's IP address

---

## Step 4: Deploy Backend to DigitalOcean

### 4.1 SSH into Your Droplet

```bash
ssh root@yourname.duckdns.org
# Or use: ssh root@YOUR_DROPLET_IP
```

### 4.2 Install Node.js and Dependencies

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install Nginx (for reverse proxy and SSL)
apt install -y nginx

# Install Certbot (for SSL certificates)
apt install -y certbot python3-certbot-nginx

# Install PM2 (process manager to keep your app running)
npm install -g pm2

# Verify installations
node --version
npm --version
nginx -v
```

### 4.3 Set Up Your Application

```bash
# Create app directory
mkdir -p /var/www/chat-app
cd /var/www/chat-app

# Clone or upload your backend code (we'll use git)
# If you haven't pushed to GitHub yet, do that first, then:
git clone YOUR_GITHUB_REPO_URL .

# If you don't have git setup, you can use SCP from your local machine:
# On your LOCAL machine, run:
# scp -r /Users/xuedong/code/chat-website/server/* root@yourname.duckdns.org:/var/www/chat-app/
```

### 4.4 Configure Environment Variables

```bash
cd /var/www/chat-app

# Create .env file
nano .env
```

Paste this (replace with your MongoDB URI):
```env
PORT=3001
MONGODB_URI=mongodb+srv://dsnowx1_db_user:iohO9u47FR1ljoXR@cluster0.5sqdt8h.mongodb.net/chat-app?retryWrites=true&w=majority&appName=Cluster0
```

Press `Ctrl+X`, then `Y`, then `Enter` to save.

### 4.5 Install Dependencies and Start Server

```bash
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

### 4.6 Configure Nginx Reverse Proxy

```bash
nano /etc/nginx/sites-available/chat-app
```

Paste this configuration (replace `yourname.duckdns.org`):

```nginx
server {
    listen 80;
    server_name yourname.duckdns.org;

    location / {
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
ln -s /etc/nginx/sites-available/chat-app /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### 4.7 Set Up SSL Certificate (HTTPS)

```bash
# Get SSL certificate from Let's Encrypt
certbot --nginx -d yourname.duckdns.org

# Follow prompts:
# - Enter email
# - Agree to terms
# - Choose to redirect HTTP to HTTPS (option 2)

# Set up auto-renewal
certbot renew --dry-run
```

---

## Step 5: Deploy Frontend to Vercel

### 5.1 Push Your Code to GitHub (if not already done)

```bash
cd /Users/xuedong/code/chat-website
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

### 5.2 Deploy to Vercel

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "Add New" → "Project"
4. Import your GitHub repository
5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Add **Environment Variables**:
   - `VITE_API_URL` = `https://yourname.duckdns.org`
   - `VITE_WS_URL` = `wss://yourname.duckdns.org`
7. Click "Deploy"
8. Wait for deployment to complete
9. Your app will be live at: `your-app.vercel.app`

---

## Step 6: Test Your Deployment

1. Visit your Vercel URL: `your-app.vercel.app`
2. Enter a nickname
3. Send messages
4. Open in another browser/incognito and test real-time chat
5. Check messages persist (MongoDB)

---

## Optional: Custom Domain on Vercel

If you want `yourname.duckdns.org` to point to your frontend:

1. In Vercel dashboard → Your project → Settings → Domains
2. Add `yourname.duckdns.org`
3. Vercel will give you a CNAME record
4. Update DuckDNS (note: DuckDNS doesn't support CNAME, so this won't work)

**Alternative**: Use a different free domain service like Freenom, or keep Vercel's default domain.

---

## Maintenance Commands

### On DigitalOcean Server

```bash
# View logs
pm2 logs chat-server

# Restart server
pm2 restart chat-server

# Stop server
pm2 stop chat-server

# Update code
cd /var/www/chat-app
git pull
npm install
pm2 restart chat-server

# Renew SSL certificate
certbot renew
```

### Update Frontend (Vercel)

Just push to GitHub:
```bash
git add .
git commit -m "Update frontend"
git push origin main
```
Vercel auto-deploys on push!

---

## Troubleshooting

### Backend not accessible
```bash
# Check if server is running
pm2 status

# Check nginx
systemctl status nginx

# Check firewall
ufw status
ufw allow 80
ufw allow 443
ufw allow ssh
```

### WebSocket connection failing
- Ensure Nginx WebSocket config is correct
- Check SSL certificate is working (wss:// requires HTTPS)
- Verify PM2 server is running

### MongoDB connection issues
- Check .env file has correct MONGODB_URI
- Verify MongoDB Atlas allows connections from your droplet IP
  - Go to MongoDB Atlas → Network Access → Add IP Address → Add your droplet IP

---

## Cost Summary

- DuckDNS: **FREE**
- Vercel (Frontend): **FREE**
- MongoDB Atlas: **FREE** (512MB)
- SSL Certificate: **FREE** (Let's Encrypt)
- DigitalOcean Droplet: **$4-6/month**

**Total: $4-6/month** (or FREE for 60 days with DigitalOcean credits!)

---

## Next Steps

Once deployed, you can:
1. Share your Vercel URL with friends
2. Monitor usage in Vercel dashboard
3. Check MongoDB Atlas for message storage
4. Add more features to your chat app!

## Need Help?

If you get stuck at any step, check:
1. PM2 logs: `pm2 logs chat-server`
2. Nginx logs: `tail -f /var/log/nginx/error.log`
3. Vercel deployment logs in the Vercel dashboard
