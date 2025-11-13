# Full Oracle Cloud Deployment (Frontend + Backend)

This guide shows how to deploy **both frontend and backend** on your Oracle Cloud instance, without using Vercel.

## Architecture

- **Oracle Cloud VM**: Hosts both frontend and backend
- **Nginx**: Serves frontend static files and proxies API/WebSocket to backend
- **MongoDB Atlas**: Database (free tier)
- **DuckDNS**: Free domain
- **Let's Encrypt**: Free SSL certificate

## Prerequisites

- Oracle Cloud instance already set up (from DEPLOYMENT_ORACLE.md)
- Backend already deployed and running with PM2
- Domain: `yourname.duckdns.org` pointing to your Oracle Cloud IP

## Step 1: Build Frontend Locally

On your local machine:

```bash
cd client

# Build for production
npm run build

# This creates client/dist/ folder with optimized static files
```

## Step 2: Upload Frontend to Oracle Cloud

```bash
# Create directory for frontend on server
ssh -i ~/.ssh/oracle-chat-server.key ubuntu@yourname.duckdns.org
sudo mkdir -p /var/www/chat-app-frontend
sudo chown -R ubuntu:ubuntu /var/www/chat-app-frontend
exit

# Upload built files from your local machine
cd client
scp -i ~/.ssh/oracle-chat-server.key -r dist/* ubuntu@yourname.duckdns.org:/var/www/chat-app-frontend/
```

Or if you prefer using Git:

```bash
# SSH into Oracle Cloud
ssh -i ~/.ssh/oracle-chat-server.key ubuntu@yourname.duckdns.org

# Clone/pull your repo
cd /var/www
git clone YOUR_REPO_URL chat-app-source
cd chat-app-source/client

# Install Node.js if not already installed
# (Already done if you followed DEPLOYMENT_ORACLE.md)

# Build on server
npm install
npm run build

# Copy to serving directory
sudo mkdir -p /var/www/chat-app-frontend
sudo cp -r dist/* /var/www/chat-app-frontend/
sudo chown -R www-data:www-data /var/www/chat-app-frontend
```

## Step 3: Configure Nginx to Serve Frontend

SSH into your Oracle Cloud instance:

```bash
ssh -i ~/.ssh/oracle-chat-server.key ubuntu@yourname.duckdns.org
```

Edit Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/chat-app
```

Replace the entire file with this configuration:

```nginx
server {
    listen 80;
    server_name yourname.duckdns.org;

    # Frontend - serve static files
    root /var/www/chat-app-frontend;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1000;

    # Frontend routing - serve index.html for all routes (SPA)
    location / {
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API endpoints - proxy to backend
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Serve uploaded images
    location /uploads/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;

        # Cache images
        proxy_cache_valid 200 7d;
        add_header Cache-Control "public, max-age=604800";
    }

    # WebSocket - proxy to backend
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket timeout
        proxy_read_timeout 86400;
    }

    # WebSocket alternative (root connection)
    location = / {
        # Try to serve static file first
        try_files $uri @websocket;
    }

    location @websocket {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

**Important**: Replace `yourname.duckdns.org` with your actual domain!

Test and reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Step 4: Update Frontend Configuration

The frontend needs to know it's deployed. Create a production environment file:

```bash
cd /var/www/chat-app-source/client

# Create .env.production file
nano .env.production
```

Add these variables:

```env
VITE_API_URL=https://yourname.duckdns.org
VITE_WS_URL=wss://yourname.duckdns.org
```

Rebuild:

```bash
npm run build
sudo cp -r dist/* /var/www/chat-app-frontend/
```

## Step 5: Setup SSL Certificate

```bash
sudo certbot --nginx -d yourname.duckdns.org

# Follow prompts:
# - Enter email
# - Agree to terms
# - Redirect HTTP to HTTPS (option 2)
```

Certbot will automatically update your Nginx config to use HTTPS.

## Step 6: Verify Deployment

1. **Visit your site**: https://yourname.duckdns.org
2. **Check frontend loads**: Should see chat interface
3. **Check WebSocket**: Connection status should be green
4. **Test image upload**: Upload an image
5. **Check from another device**: Verify real-time messaging works

## File Structure on Server

```
/var/www/
├── chat-app/                    # Backend (running via PM2)
│   ├── index.js
│   ├── uploads/                 # Uploaded images
│   ├── .env                     # Backend config
│   └── package.json
│
├── chat-app-frontend/           # Frontend (served by Nginx)
│   ├── index.html
│   ├── assets/
│   │   ├── index-*.js
│   │   └── index-*.css
│   └── manifest.json
│
└── chat-app-source/ (optional)  # Source code for rebuilding
    ├── client/
    └── server/
```

## Updating Your App

### Update Backend

```bash
ssh -i ~/.ssh/oracle-chat-server.key ubuntu@yourname.duckdns.org

cd /var/www/chat-app
git pull
npm install
pm2 restart chat-server

# Check logs
pm2 logs chat-server
```

### Update Frontend

```bash
# Option 1: Build locally and upload
cd client
npm run build
scp -i ~/.ssh/oracle-chat-server.key -r dist/* ubuntu@yourname.duckdns.org:/var/www/chat-app-frontend/

# Option 2: Build on server
ssh -i ~/.ssh/oracle-chat-server.key ubuntu@yourname.duckdns.org
cd /var/www/chat-app-source/client
git pull
npm install
npm run build
sudo cp -r dist/* /var/www/chat-app-frontend/
```

No need to restart anything - Nginx serves the new files immediately!

## Automated Deployment Script

Create a deployment script on your Oracle Cloud server:

```bash
ssh -i ~/.ssh/oracle-chat-server.key ubuntu@yourname.duckdns.org
nano ~/deploy-chat-app.sh
```

Add this content:

```bash
#!/bin/bash

echo "🚀 Deploying Chat App..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Update source code
echo -e "${YELLOW}📥 Pulling latest code...${NC}"
cd /var/www/chat-app-source
git pull

# Update backend
echo -e "${YELLOW}⚙️  Updating backend...${NC}"
cd server
npm install
pm2 restart chat-server
echo -e "${GREEN}✅ Backend updated${NC}"

# Update frontend
echo -e "${YELLOW}🎨 Building frontend...${NC}"
cd ../client
npm install
npm run build
sudo cp -r dist/* /var/www/chat-app-frontend/
echo -e "${GREEN}✅ Frontend updated${NC}"

# Check PM2 status
echo -e "${YELLOW}📊 Backend status:${NC}"
pm2 status

echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo -e "Visit: https://yourname.duckdns.org"
```

Make it executable:

```bash
chmod +x ~/deploy-chat-app.sh
```

Now you can deploy with one command:

```bash
ssh -i ~/.ssh/oracle-chat-server.key ubuntu@yourname.duckdns.org './deploy-chat-app.sh'
```

## Storage Monitoring

Your image cleanup now runs:
- **Every 6 hours** via cron
- **On every image upload** if storage > 50%
- **Hourly storage check** (logs warning if > 60%)

Check storage:

```bash
ssh -i ~/.ssh/oracle-chat-server.key ubuntu@yourname.duckdns.org

# Check overall disk usage
df -h /

# Check uploads folder size
du -sh /var/www/chat-app/uploads

# View cleanup logs
pm2 logs chat-server | grep -i cleanup
```

## Performance Optimization

### Enable Nginx Caching

Edit Nginx config:

```bash
sudo nano /etc/nginx/nginx.conf
```

Add inside `http` block:

```nginx
# Cache configuration
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m;
```

Then in your site config, add to `/uploads/` location:

```nginx
location /uploads/ {
    proxy_pass http://localhost:3001;
    proxy_cache my_cache;
    proxy_cache_valid 200 7d;
    add_header X-Cache-Status $upstream_cache_status;
}
```

### Monitor Performance

```bash
# Check Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Monitor server resources
htop
```

## Troubleshooting

### Frontend Shows Blank Page

```bash
# Check if files exist
ls -la /var/www/chat-app-frontend/

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Test Nginx config
sudo nginx -t
```

### WebSocket Not Connecting

```bash
# Check backend is running
pm2 status
pm2 logs chat-server

# Test WebSocket endpoint
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:3001
```

### Images Not Loading

```bash
# Check uploads directory exists
ls -la /var/www/chat-app/uploads/

# Check permissions
sudo chown -R ubuntu:ubuntu /var/www/chat-app/uploads
chmod 755 /var/www/chat-app/uploads

# Check Nginx proxy
curl -I https://yourname.duckdns.org/uploads/test.jpg
```

### Storage Issues

```bash
# Manual cleanup
ssh -i ~/.ssh/oracle-chat-server.key ubuntu@yourname.duckdns.org
cd /var/www/chat-app

# Delete images older than 3 days
find uploads/ -type f -mtime +3 -delete

# Check storage
df -h /
```

## Cost Summary

**Total Cost: $0/month FOREVER**

- Oracle Cloud Always Free: FREE ✅
- DuckDNS: FREE ✅
- MongoDB Atlas Free Tier: FREE ✅
- Let's Encrypt SSL: FREE ✅
- No Vercel needed: FREE ✅

## Backup Strategy

### Automated Backups

Create a backup script:

```bash
nano ~/backup-chat-app.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/chat-app/uploads/

# Backup MongoDB (if local) - not needed for Atlas
# mongodump --out=$BACKUP_DIR/mongodb_$DATE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

Schedule it:

```bash
chmod +x ~/backup-chat-app.sh
crontab -e

# Add this line (backup daily at 3 AM):
0 3 * * * /home/ubuntu/backup-chat-app.sh
```

## Next Steps

Your chat app is now fully deployed on Oracle Cloud! 🎉

**Share your app**: https://yourname.duckdns.org

**Monitor it**:
```bash
pm2 monit
```

**View logs**:
```bash
pm2 logs chat-server
```

---

Need help? Check the main [README.md](./README.md) or [IMAGE_UPLOAD_FEATURE.md](./IMAGE_UPLOAD_FEATURE.md)
