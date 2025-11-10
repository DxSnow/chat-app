# Quick Deploy Guide

Fast-track deployment guide for your chat application.

## Prerequisites Checklist

- [ ] DuckDNS domain (yourname.duckdns.org)
- [ ] DigitalOcean account with droplet created
- [ ] GitHub repository (optional but recommended)
- [ ] MongoDB Atlas configured (already done ✓)

---

## 5-Minute Deployment

### 1. Get DuckDNS Domain (2 minutes)

```
1. Visit: https://www.duckdns.org
2. Sign in
3. Create subdomain: yourname.duckdns.org
4. Save your token
```

### 2. Create DigitalOcean Droplet (2 minutes)

```
1. Visit: https://www.digitalocean.com
2. Create Droplet:
   - Ubuntu 22.04 LTS
   - $4/month plan (512MB)
   - Choose closest region
3. Save droplet IP address
```

### 3. Point DuckDNS to Your Server (30 seconds)

```
1. Go back to DuckDNS
2. Paste your droplet IP in "current ip" field
3. Click "update ip"
```

### 4. Setup Server (10 minutes)

SSH into your droplet:
```bash
ssh root@yourname.duckdns.org
```

Run automated setup script:
```bash
# Download and run the setup script
curl -o deploy-setup.sh https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/server/deploy-setup.sh
chmod +x deploy-setup.sh
sudo bash deploy-setup.sh
```

Or manually follow [DEPLOYMENT.md](DEPLOYMENT.md) Step 4.

### 5. Upload Your Backend Code

Option A - Using Git (Recommended):
```bash
cd /var/www/chat-app
git clone YOUR_GITHUB_REPO .
```

Option B - Using SCP from your local machine:
```bash
# Run this on YOUR LOCAL machine
scp -r /Users/xuedong/code/chat-website/server/* root@yourname.duckdns.org:/var/www/chat-app/
```

### 6. Configure and Start Backend

```bash
cd /var/www/chat-app

# Create .env file
cat > .env << 'EOF'
PORT=3001
MONGODB_URI=YOUR_MONGODB_URI_HERE
EOF

# Install dependencies
npm install

# Start with PM2
pm2 start index.js --name chat-server
pm2 startup systemd
pm2 save
```

### 7. Configure Nginx

```bash
nano /etc/nginx/sites-available/chat-app
```

Paste (replace `yourname.duckdns.org`):
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
    }
}
```

Enable and restart:
```bash
ln -s /etc/nginx/sites-available/chat-app /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### 8. Setup SSL (HTTPS)

```bash
certbot --nginx -d yourname.duckdns.org
# Choose option 2 (redirect HTTP to HTTPS)
```

### 9. Deploy Frontend to Vercel (5 minutes)

1. Visit https://vercel.com
2. Import your GitHub repo
3. Configure:
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add Environment Variables:
   - `VITE_API_URL` = `https://yourname.duckdns.org`
   - `VITE_WS_URL` = `wss://yourname.duckdns.org`
5. Deploy!

### 10. Test

Visit your Vercel URL → Enter nickname → Start chatting! 🎉

---

## Quick Commands Reference

### Server Management
```bash
pm2 status                  # Check status
pm2 logs chat-server        # View logs
pm2 restart chat-server     # Restart
```

### Update Backend
```bash
cd /var/www/chat-app
git pull                    # Get latest code
npm install                 # Install new dependencies
pm2 restart chat-server     # Restart server
```

### Update Frontend
```bash
git push origin main        # Vercel auto-deploys!
```

---

## Troubleshooting

**Can't SSH into server?**
```bash
ssh root@YOUR_DROPLET_IP  # Use IP instead of domain
```

**Backend not accessible?**
```bash
pm2 logs chat-server        # Check for errors
systemctl status nginx      # Check nginx
```

**WebSocket not working?**
- Ensure SSL is set up (wss:// requires https://)
- Check Nginx config includes WebSocket headers

**Need detailed help?**
See [DEPLOYMENT.md](DEPLOYMENT.md) for comprehensive guide.

---

## Cost Breakdown

| Service | Cost |
|---------|------|
| DuckDNS | FREE |
| Vercel | FREE |
| MongoDB Atlas | FREE (512MB) |
| SSL Certificate | FREE |
| DigitalOcean | $4-6/month |

**Total: $4-6/month** (FREE for 60 days with DO credits)

---

## Next: Share Your App!

Once deployed, share your Vercel URL:
```
https://your-app.vercel.app
```

Enjoy your live chat application! 🚀
