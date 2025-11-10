# Quick Deploy Guide - AWS EC2

Fast-track deployment for your chat application on AWS (12 months FREE).

## Why AWS?

- ✅ **12 months FREE** (vs DigitalOcean $4/mo from day 1)
- ✅ t2.micro instance (1GB RAM, 1 vCPU)
- ✅ 750 hours/month free (run 24/7 for a year!)
- ✅ Better global infrastructure
- ✅ Easy to scale later

---

## Prerequisites Checklist

- [ ] DuckDNS domain (yourname.duckdns.org)
- [ ] AWS account (will create)
- [ ] GitHub repository (optional but recommended)
- [ ] MongoDB Atlas configured (already done ✓)

---

## 10-Minute Deployment

### Step 1: Get DuckDNS Domain (2 minutes)

1. Visit: https://www.duckdns.org
2. Sign in (GitHub/Google)
3. Create subdomain: `yourname.duckdns.org`
4. Save your token
5. **Don't update IP yet** - we'll do this after creating EC2

### Step 2: Create AWS Account (5 minutes)

1. Visit: https://aws.amazon.com
2. Click "Create an AWS Account"
3. Enter email, password, account name
4. Add payment method (won't be charged on free tier)
5. Verify phone number
6. Choose "Free" support plan
7. Complete registration

### Step 3: Launch EC2 Instance (5 minutes)

1. **Sign in to AWS Console**: https://console.aws.amazon.com
2. Search "EC2" → Click "EC2"
3. Click **"Launch Instance"**

**Quick Config:**
```
Name: chat-server
OS: Ubuntu Server 22.04 LTS
Instance type: t2.micro (FREE TIER)
Key pair: Create new → "chat-server-key" → Download .pem file
Network settings:
  ✓ SSH (22) - Your IP
  ✓ HTTP (80) - Anywhere
  ✓ HTTPS (443) - Anywhere
Storage: 8 GB (default)
```

4. Click **"Launch instance"**
5. Wait for "Running" status
6. **Save your EC2 Public IP** (e.g., `54.123.45.67`)

### Step 4: Prepare SSH Key (1 minute)

**Mac/Linux:**
```bash
mv ~/Downloads/chat-server-key.pem ~/.ssh/
chmod 400 ~/.ssh/chat-server-key.pem
```

**Windows:** Use PuTTY with `.ppk` file

### Step 5: Point DuckDNS to EC2 (30 seconds)

1. Go back to https://www.duckdns.org
2. Paste your **EC2 public IP** in "current ip"
3. Click "update ip"

Test:
```bash
ping yourname.duckdns.org
# Should show your EC2 IP
```

### Step 6: Setup EC2 Server (10 minutes)

**SSH into your instance:**
```bash
ssh -i ~/.ssh/chat-server-key.pem ubuntu@yourname.duckdns.org
```

**Run automated setup:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install dependencies
sudo apt install -y nginx certbot python3-certbot-nginx git
sudo npm install -g pm2

# Verify
node --version
npm --version
```

### Step 7: Deploy Your Backend (5 minutes)

```bash
# Create app directory
sudo mkdir -p /var/www/chat-app
sudo chown -R ubuntu:ubuntu /var/www/chat-app
cd /var/www/chat-app

# Clone your code (or use SCP)
git clone YOUR_GITHUB_REPO_URL .

# Create .env file
nano .env
```

Paste (with your MongoDB URI):
```env
PORT=3001
MONGODB_URI=your_mongodb_uri_here
```

Save with `Ctrl+X`, `Y`, `Enter`.

```bash
# Install and start
npm install
pm2 start index.js --name chat-server
pm2 startup systemd
# Run the command it outputs
pm2 save
```

### Step 8: Configure Nginx (2 minutes)

```bash
sudo nano /etc/nginx/sites-available/chat-app
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

```bash
# Enable and restart
sudo ln -s /etc/nginx/sites-available/chat-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 9: Setup SSL (2 minutes)

```bash
sudo certbot --nginx -d yourname.duckdns.org
# Enter email, agree to terms, choose redirect (option 2)
```

### Step 10: Deploy Frontend to Vercel (5 minutes)

1. Visit https://vercel.com
2. Sign in with GitHub
3. Import your repository
4. Configure:
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add Environment Variables:
   - `VITE_API_URL` = `https://yourname.duckdns.org`
   - `VITE_WS_URL` = `wss://yourname.duckdns.org`
6. Click "Deploy"

**Done!** Visit your Vercel URL and start chatting! 🎉

---

## Quick Reference Commands

### Server Management

```bash
# SSH into server
ssh -i ~/.ssh/chat-server-key.pem ubuntu@yourname.duckdns.org

# Check status
pm2 status

# View logs
pm2 logs chat-server

# Restart
pm2 restart chat-server

# Update code
cd /var/www/chat-app
git pull
npm install
pm2 restart chat-server
```

### AWS Management

**Stop EC2 Instance (Save Money):**
```
AWS Console → EC2 → Instances → Select → Instance state → Stop
(Only storage charged when stopped: ~$0.80/month)
```

**Start EC2 Instance:**
```
AWS Console → EC2 → Instances → Select → Instance state → Start
(IP might change - update DuckDNS!)
```

---

## Troubleshooting

### Can't SSH?
```bash
chmod 400 ~/.ssh/chat-server-key.pem
ssh -i ~/.ssh/chat-server-key.pem ubuntu@YOUR_EC2_IP
```

### Backend not working?
```bash
pm2 logs chat-server
sudo systemctl status nginx
```

### Check EC2 Security Group:
AWS Console → EC2 → Security Groups → chat-server-sg
Ensure ports 22, 80, 443 are open

### MongoDB connection failed?
- MongoDB Atlas → Network Access → Add your EC2 IP

---

## Cost Summary

| Service | Cost |
|---------|------|
| AWS EC2 | **FREE for 12 months** |
| DuckDNS | **FREE forever** |
| Vercel | **FREE forever** |
| MongoDB Atlas | **FREE forever** |
| SSL | **FREE forever** |

**Total: $0/month for first year, then ~$9/month**

---

## AWS Free Tier Limits

To stay FREE:
- ✅ 1 t2.micro instance only
- ✅ 750 hours/month (= 24/7 for 1 instance)
- ✅ 30 GB storage max
- ✅ 15 GB data transfer/month

**Set up billing alerts:**
1. AWS Console → Billing Dashboard
2. Budgets → Create budget
3. Set alert at $1 to catch any charges

---

## Next Steps

After deployment:
1. ✅ Test real-time chat
2. ✅ Share Vercel URL with friends
3. ✅ Monitor AWS usage
4. ✅ Set up billing alerts
5. ✅ Add more features!

**Enjoy your FREE chat app for 12 months!** 🚀

For detailed instructions, see [DEPLOYMENT_AWS.md](DEPLOYMENT_AWS.md)
