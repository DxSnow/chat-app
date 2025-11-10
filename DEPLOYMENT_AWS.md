# Deployment Guide - AWS EC2 + DuckDNS + Vercel

Deploy your chat application using AWS EC2 (12 months FREE) with DuckDNS and Vercel.

## Architecture Overview

- **Frontend**: Deployed on Vercel (FREE forever)
- **Backend**: Deployed on AWS EC2 t2.micro (FREE for 12 months)
- **Database**: MongoDB Atlas (Already configured, FREE tier)
- **Domain**: DuckDNS (FREE subdomain)
- **SSL**: Let's Encrypt via Nginx (FREE)

**Total Cost: FREE for 12 months, then ~$5-10/month**

---

## Step 1: Get Your DuckDNS Domain

1. Go to https://www.duckdns.org
2. Sign in with GitHub/Google/Reddit/Twitter
3. Enter your desired subdomain name (e.g., `snowchat`)
4. Click "add domain"
5. **Save your token** - you'll need it later
6. Your domain: `yourname.duckdns.org`

---

## Step 2: Create AWS Account & EC2 Instance

### 2.1 Create AWS Account

1. Go to https://aws.amazon.com
2. Click "Create an AWS Account"
3. Follow the signup process:
   - Enter email and account name
   - Verify email
   - Add payment method (won't be charged on free tier)
   - Verify phone number
   - Choose "Free" support plan
4. Complete registration

### 2.2 Launch EC2 Instance

1. **Sign in to AWS Console**: https://console.aws.amazon.com
2. Search for "EC2" in the top search bar, click "EC2"
3. Click "Launch Instance" (orange button)
4. Configure your instance:

   **Name and tags:**
   - Name: `chat-server`

   **Application and OS Images (Amazon Machine Image):**
   - Choose: **Ubuntu Server 22.04 LTS**
   - Architecture: **64-bit (x86)**

   **Instance type:**
   - Choose: **t2.micro** (Free tier eligible - shows "Free tier eligible" label)
   - 1 vCPU, 1 GB RAM

   **Key pair (login):**
   - Click "Create new key pair"
   - Key pair name: `chat-server-key`
   - Key pair type: RSA
   - Private key file format: `.pem` (for Mac/Linux) or `.ppk` (for Windows)
   - Click "Create key pair"
   - **IMPORTANT**: Save the downloaded `.pem` file securely!

   **Network settings:**
   - Click "Edit"
   - Auto-assign public IP: **Enable**
   - Firewall (security groups): Create new security group
   - Security group name: `chat-server-sg`
   - Description: `Security group for chat server`
   - Add these rules:
     - ✅ SSH (Port 22) - Source: My IP (for security) or Anywhere (0.0.0.0/0)
     - ✅ HTTP (Port 80) - Source: Anywhere (0.0.0.0/0)
     - ✅ HTTPS (Port 443) - Source: Anywhere (0.0.0.0/0)

   **Configure storage:**
   - Default: 8 GB gp3 (Free tier eligible - up to 30 GB)
   - Keep default settings

5. Review and click **"Launch instance"**
6. Wait for instance to start (Status: Running)
7. Select your instance and find:
   - **Public IPv4 address** (e.g., `54.123.45.67`) - **SAVE THIS!**
   - **Public IPv4 DNS** (e.g., `ec2-54-123-45-67.compute-1.amazonaws.com`)

### 2.3 Prepare SSH Key (Mac/Linux)

```bash
# Move key to .ssh directory
mv ~/Downloads/chat-server-key.pem ~/.ssh/
chmod 400 ~/.ssh/chat-server-key.pem
```

For Windows, use PuTTY and convert `.ppk` file.

---

## Step 3: Configure DuckDNS to Point to Your Server

1. Go back to https://www.duckdns.org
2. You should see your domain listed
3. In the "current ip" field, paste your **AWS EC2 public IP**
4. Click "update ip"
5. Test (wait 1-2 minutes):
   ```bash
   ping yourname.duckdns.org
   ```
   You should see your EC2 IP address

---

## Step 4: Deploy Backend to AWS EC2

### 4.1 SSH into Your EC2 Instance

```bash
ssh -i ~/.ssh/chat-server-key.pem ubuntu@yourname.duckdns.org
# Or use: ssh -i ~/.ssh/chat-server-key.pem ubuntu@YOUR_EC2_IP

# First time: type "yes" to confirm fingerprint
```

**Note**: AWS Ubuntu instances use `ubuntu` user, not `root`.

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

# Install Git
sudo apt install -y git

# Verify installations
node --version
npm --version
nginx -v
pm2 --version
```

### 4.3 Set Up Your Application

```bash
# Create app directory
sudo mkdir -p /var/www/chat-app
sudo chown -R ubuntu:ubuntu /var/www/chat-app
cd /var/www/chat-app

# Clone your code (option A - recommended)
git clone YOUR_GITHUB_REPO_URL .

# OR upload via SCP from your local machine (option B):
# On your LOCAL machine, run:
# scp -i ~/.ssh/chat-server-key.pem -r /Users/xuedong/code/chat-website/server/* ubuntu@yourname.duckdns.org:/var/www/chat-app/
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
# Copy and run the command it outputs, e.g.:
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu

pm2 save

# Check status
pm2 status
pm2 logs chat-server
```

### 4.6 Configure Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/chat-app
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
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/chat-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Test: Visit `http://yourname.duckdns.org` - you should see your backend API!

### 4.7 Set Up SSL Certificate (HTTPS)

```bash
# Get SSL certificate from Let's Encrypt
sudo certbot --nginx -d yourname.duckdns.org

# Follow prompts:
# - Enter email
# - Agree to terms
# - Choose to redirect HTTP to HTTPS (option 2)

# Test auto-renewal
sudo certbot renew --dry-run
```

Your backend is now live at `https://yourname.duckdns.org`! 🎉

---

## Step 5: Deploy Frontend to Vercel

### 5.1 Push Your Code to GitHub (if not already done)

```bash
cd /Users/xuedong/code/chat-website

git add .
git commit -m "Prepare for AWS deployment"
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
   - Name: `VITE_API_URL`, Value: `https://yourname.duckdns.org`
   - Name: `VITE_WS_URL`, Value: `wss://yourname.duckdns.org`
7. Click "Deploy"
8. Wait for deployment to complete (~2 minutes)
9. Your app will be live at: `your-app.vercel.app`

---

## Step 6: Test Your Deployment

1. Visit your Vercel URL: `your-app.vercel.app`
2. Enter a nickname
3. Send messages
4. Open in another browser/incognito and test real-time chat
5. Check messages persist (MongoDB)
6. Refresh page - nickname should be saved (localStorage)

**Congratulations! Your chat app is live!** 🚀

---

## AWS-Specific Management Commands

### Managing Your EC2 Instance

**Start/Stop Instance (Save Money):**
```bash
# In AWS Console:
# EC2 → Instances → Select instance → Instance state → Stop/Start

# When stopped, you're not charged for compute hours (only storage ~$0.80/month)
# Your data is preserved when stopped
```

**Connect via SSH:**
```bash
ssh -i ~/.ssh/chat-server-key.pem ubuntu@yourname.duckdns.org
```

**Update Your Application:**
```bash
ssh -i ~/.ssh/chat-server-key.pem ubuntu@yourname.duckdns.org
cd /var/www/chat-app
git pull
npm install
pm2 restart chat-server
```

**View Logs:**
```bash
pm2 logs chat-server
sudo tail -f /var/log/nginx/error.log
```

**Restart Services:**
```bash
pm2 restart chat-server
sudo systemctl restart nginx
```

---

## Security Best Practices

### 1. Update EC2 Security Group (Restrict SSH)

1. Go to EC2 Console → Security Groups
2. Select `chat-server-sg`
3. Edit inbound rules
4. Change SSH (Port 22) source from `0.0.0.0/0` to "My IP"
5. This prevents unauthorized SSH access

### 2. Keep System Updated

```bash
ssh -i ~/.ssh/chat-server-key.pem ubuntu@yourname.duckdns.org
sudo apt update && sudo apt upgrade -y
```

### 3. Monitor MongoDB Access

1. Go to MongoDB Atlas
2. Network Access
3. Make sure only your EC2 IP is whitelisted (or 0.0.0.0/0 for testing)

### 4. Set Up Automatic Backups

AWS offers automated snapshots - consider enabling for your EC2 instance.

---

## Cost Breakdown

| Service | Free Tier | After Free Tier |
|---------|-----------|-----------------|
| AWS EC2 t2.micro | 12 months FREE (750 hrs/month) | ~$8.50/month |
| AWS EBS Storage (8GB) | 12 months FREE (30GB) | ~$0.80/month |
| AWS Data Transfer | 12 months FREE (15GB/month) | $0.09/GB |
| DuckDNS | FREE forever | FREE |
| Vercel | FREE forever | FREE |
| MongoDB Atlas | FREE forever (512MB) | FREE |
| SSL Certificate | FREE forever | FREE |

**Total: FREE for 12 months, then ~$9-10/month**

---

## Troubleshooting

### Can't SSH into EC2?

```bash
# Check key permissions
chmod 400 ~/.ssh/chat-server-key.pem

# Use IP instead of domain
ssh -i ~/.ssh/chat-server-key.pem ubuntu@YOUR_EC2_IP

# Check security group allows SSH from your IP
```

### Backend not accessible?

```bash
# Check PM2 status
pm2 status
pm2 logs chat-server

# Check Nginx
sudo systemctl status nginx
sudo nginx -t

# Check EC2 security group allows ports 80 and 443
```

### WebSocket not working?

- Ensure SSL is set up (wss:// requires https://)
- Check Nginx config includes WebSocket headers
- Verify security group allows inbound traffic on port 443

### MongoDB connection failing?

```bash
# Check .env file
cat /var/www/chat-app/.env

# Test connection
pm2 logs chat-server

# In MongoDB Atlas:
# - Network Access → Add EC2 public IP
# - Or allow 0.0.0.0/0 for testing
```

---

## Monitoring & Maintenance

### AWS CloudWatch (Free Tier)

Monitor your EC2 instance:
1. EC2 Console → Your Instance → Monitoring tab
2. View CPU, Network, Disk metrics
3. Set up alarms for high CPU usage

### PM2 Monitoring

```bash
pm2 monit  # Real-time monitoring
pm2 logs   # View all logs
```

---

## Scaling & Optimization

When your app grows:

1. **Upgrade EC2 instance**: t2.micro → t2.small/medium
2. **Enable CloudFront CDN** for faster content delivery
3. **Use Elastic Load Balancer** for multiple instances
4. **Upgrade MongoDB Atlas** for more storage
5. **Consider AWS Lambda** for serverless backend

---

## Next Steps

Your chat app is now live! Here's what you can do:

1. ✅ Share your Vercel URL with friends
2. ✅ Monitor usage in AWS Console
3. ✅ Check MongoDB Atlas for message storage
4. ✅ Add more features (emoji support, typing indicators, etc.)
5. ✅ Set up monitoring and alerts
6. ✅ Consider custom domain (instead of Vercel default)

**Enjoy your live chat application!** 🚀

---

## AWS Free Tier Tips

To stay within free tier:
- ✅ Use only 1 t2.micro instance
- ✅ Keep storage under 30 GB
- ✅ Keep data transfer under 15 GB/month
- ✅ Stop instance when not in use (saves compute hours)
- ✅ Set up billing alerts in AWS Console

**Important**: After 12 months, monitor your AWS bill carefully!
