# Deployment Guide - Oracle Cloud Always Free Tier

Deploy your chat application using Oracle Cloud's Always Free tier (FREE FOREVER!) with DuckDNS and Vercel.

## Why Oracle Cloud Always Free?

✅ **FREE FOREVER** (not 12 months, but FOREVER!)
✅ **Better specs than AWS free tier**
✅ **2 AMD VMs (1GB each) OR 4 ARM VMs (24GB total!)**
✅ **200 GB storage**
✅ **10 TB outbound data transfer/month**
✅ **No expiration**

This is the best free hosting option available!

---

## Architecture Overview

- **Frontend**: Vercel (FREE forever)
- **Backend**: Oracle Cloud Always Free tier
- **Database**: MongoDB Atlas (FREE tier)
- **Domain**: DuckDNS (FREE)
- **SSL**: Let's Encrypt (FREE)

**Total Cost: $0 FOREVER** 🎉

---

## Step 1: Get Your DuckDNS Domain

1. Go to https://www.duckdns.org
2. Sign in with GitHub/Google/Reddit/Twitter
3. Enter subdomain (e.g., `snowchat`)
4. Click "add domain"
5. **Save your token**
6. You get: `yourname.duckdns.org`

---

## Step 2: Create Oracle Cloud Account

### 2.1 Sign Up

1. Go to https://www.oracle.com/cloud/free/
2. Click **"Start for free"**
3. Fill in details:
   - Country/Territory
   - Name and Email
   - Create password
4. Click **"Verify my email"**
5. Check email and verify

### 2.2 Complete Account Setup

1. Choose **"Individual"** account type
2. Enter address details
3. Add payment method (for verification only - won't be charged!)
   - Oracle requires credit card to prevent abuse
   - **Free tier never charges unless you upgrade**
4. Verify phone number
5. Complete registration
6. Wait for account approval (~5-10 minutes)

### 2.3 Sign In

1. Go to https://cloud.oracle.com
2. Enter your **Cloud Account Name** (you set this during registration)
3. Click **"Next"**
4. Sign in with your credentials

---

## Step 3: Create Compute Instance (VM)

### 3.1 Navigate to Compute

1. In Oracle Cloud Console, click **☰** (hamburger menu)
2. **Compute** → **Instances**
3. Click **"Create Instance"**

### 3.2 Configure Instance

**Name:**
```
   chat-server
```

**Placement:**
- Leave default (usually "Always Free Eligible")

**Image and Shape:**

1. Click **"Edit"** next to Image and Shape
2. **Image:**
   - Click **"Change Image"**
   - Select **"Canonical Ubuntu"** → **"22.04"**
   - Click **"Select Image"**

3. **Shape:**
   - Click **"Change Shape"**
   - Select **"Specialty and previous generation"**
   - Choose **VM.Standard.E2.1.Micro** (Always Free)
     - 1 OCPU
     - 1 GB RAM
     - Shows "Always Free-eligible" badge
   - Click **"Select Shape"**

**Networking:**

1. **Create new virtual cloud network**: Leave checked
2. **Assign a public IPv4 address**: ✅ Check this!
3. Leave other defaults

**Add SSH Keys:**

1. **Generate SSH key pair** (Recommended):
   - Click **"Save Private Key"** → Download `ssh-key-YYYY-MM-DD.key`
   - Click **"Save Public Key"** → Download public key
   - **SAVE THE PRIVATE KEY SECURELY!**

2. OR **Upload your own public key** if you have one

**Boot Volume:**
- Leave default (50 GB - Always Free eligible)

### 3.3 Create Instance

1. Review configuration
2. Click **"Create"**
3. Wait for status: **"Running"** (green) - takes ~1-2 minutes
4. **SAVE THE PUBLIC IP ADDRESS!** (shown on instance details page)

---

## Step 4: Configure Network Security

Oracle Cloud blocks most ports by default. We need to open ports for HTTP, HTTPS, and SSH.

### 4.1 Configure Security List

1. On your instance details page, under **"Instance Information"**
2. Click on the **"Virtual cloud network"** link
3. Click on **"Public Subnet-..."** under Subnets
4. Click on **"Default Security List for vcn-..."** under Security Lists
5. Click **"Add Ingress Rules"**

**Add these rules one by one:**

**Rule 1 - HTTP:**
```
Source CIDR: 0.0.0.0/0
IP Protocol: TCP
Destination Port Range: 80
Description: HTTP
```
Click **"Add Ingress Rules"**

**Rule 2 - HTTPS:**
```
Source CIDR: 0.0.0.0/0
IP Protocol: TCP
Destination Port Range: 443
Description: HTTPS
```
Click **"Add Ingress Rules"**

**Note:** SSH (port 22) is already allowed by default.

### 4.2 Configure Ubuntu Firewall

We also need to configure the Ubuntu firewall (iptables) on the instance itself. We'll do this after SSHing in.

---

## Step 5: Connect to Your Instance

### 5.1 Prepare SSH Key (Mac/Linux)

```bash
# Move key to .ssh directory
mv ~/Downloads/ssh-key-*.key ~/.ssh/oracle-chat-server.key

# Set correct permissions (required!)
chmod 400 ~/.ssh/oracle-chat-server.key
```

### 5.2 SSH into Instance

```bash
# Oracle Cloud Ubuntu instances use 'ubuntu' user
ssh -i ~/.ssh/oracle-chat-server.key ubuntu@YOUR_ORACLE_IP
# Type "yes" when asked about fingerprint
```

**Note:** If you get "Connection refused", wait a minute and try again. The instance might still be booting.

### 5.3 Configure Ubuntu Firewall

```bash
# Oracle Cloud Ubuntu has iptables rules that block ports
# We need to open ports 80 and 443

sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT

# Save rules permanently
sudo netfilter-persistent save

# If netfilter-persistent is not installed:
sudo apt-get install -y iptables-persistent
# Choose "Yes" when asked to save current rules
```

---

## Step 6: Configure DuckDNS

1. Go back to https://www.duckdns.org
2. Paste your **Oracle Cloud instance public IP** in "current ip"
3. Click **"update ip"**

Test (wait 1-2 minutes):
```bash
ping yourname.duckdns.org
# Should show your Oracle Cloud IP
```

---

## Step 7: Deploy Backend

### 7.1 Install Node.js and Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx

# Install PM2
sudo npm install -g pm2

# Install Git
sudo apt install -y git

# Verify installations
node --version
npm --version
nginx -v
pm2 --version
```

### 7.2 Deploy Your Application

```bash
# Create app directory
sudo mkdir -p /var/www/chat-app
sudo chown -R ubuntu:ubuntu /var/www/chat-app
cd /var/www/chat-app

# Clone your code
git clone YOUR_GITHUB_REPO_URL .

# OR upload via SCP from your local machine:
# scp -i ~/.ssh/oracle-chat-server.key -r /Users/xuedong/code/chat-website/server/* ubuntu@yourname.duckdns.org:/var/www/chat-app/
```

### 7.3 Configure Environment

```bash
cd /var/www/chat-app

# Create .env file
nano .env
```

Paste (with your MongoDB URI):
```env
PORT=3001
MONGODB_URI=mongodb+srv://dsnowx1_db_user:iohO9u47FR1ljoXR@cluster0.5sqdt8h.mongodb.net/chat-app?retryWrites=true&w=majority&appName=Cluster0
```

Press `Ctrl+X`, `Y`, `Enter` to save.

### 7.4 Install and Start Server

```bash
npm install

# Start with PM2
pm2 start index.js --name chat-server

# Configure PM2 to start on boot
pm2 startup systemd
# Copy and run the command it outputs

pm2 save

# Check status
pm2 status
pm2 logs chat-server
```

### 7.5 Configure Nginx

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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/chat-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Test: Visit `http://yourname.duckdns.org` - you should see your backend!

### 7.6 Setup SSL Certificate

```bash
sudo certbot --nginx -d yourname.duckdns.org

# Follow prompts:
# - Enter email
# - Agree to terms
# - Redirect HTTP to HTTPS (option 2)

# Test auto-renewal
sudo certbot renew --dry-run
```

**Backend is now live at `https://yourname.duckdns.org`!** 🎉

---

## Step 8: Deploy Frontend to Vercel

### 8.1 Push to GitHub

```bash
cd /Users/xuedong/code/chat-website

git add .
git commit -m "Prepare for Oracle Cloud deployment"
git push origin main
```

### 8.2 Deploy to Vercel

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click **"Add New"** → **"Project"**
4. Import your repository
5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. **Environment Variables**:
   - Name: `VITE_API_URL`, Value: `https://yourname.duckdns.org`
   - Name: `VITE_WS_URL`, Value: `wss://yourname.duckdns.org`
7. Click **"Deploy"**
8. Wait ~2 minutes
9. Your app is live at: `your-app.vercel.app`

---

## Step 9: Test Your App

1. Visit your Vercel URL
2. Enter nickname
3. Send messages
4. Open in another browser/tab
5. Test real-time chat
6. Refresh - nickname persists!

**🎉 YOUR APP IS LIVE AND FREE FOREVER!**

---

## Oracle Cloud Management

### Useful Commands

**SSH into instance:**
```bash
ssh -i ~/.ssh/oracle-chat-server.key ubuntu@yourname.duckdns.org
```

**Check server status:**
```bash
pm2 status
pm2 logs chat-server
```

**Restart server:**
```bash
pm2 restart chat-server
```

**Update application:**
```bash
cd /var/www/chat-app
git pull
npm install
pm2 restart chat-server
```

**View Nginx logs:**
```bash
sudo tail -f /var/log/nginx/error.log
```

### Oracle Cloud Console

**Stop Instance (saves resources):**
1. Oracle Cloud Console → Compute → Instances
2. Select instance
3. Click **"Stop"**

**Start Instance:**
1. Select stopped instance
2. Click **"Start"**
3. **Note:** Public IP might change! Update DuckDNS

**Monitor Usage:**
1. Dashboard shows CPU, memory, network usage
2. Always Free resources never expire
3. Monitor to ensure you stay within free tier

---

## Cost Breakdown

| Service | Cost |
|---------|------|
| Oracle Cloud Compute | **FREE FOREVER** ✅ |
| Oracle Cloud Storage | **FREE FOREVER** ✅ |
| DuckDNS | **FREE FOREVER** ✅ |
| Vercel | **FREE FOREVER** ✅ |
| MongoDB Atlas | **FREE FOREVER** ✅ |
| SSL Certificate | **FREE FOREVER** ✅ |

**Total: $0/month FOREVER** 🎉

---

## Always Free Limits

Oracle Cloud Always Free includes:

**Compute:**
- 2 AMD-based VMs (1/8 OCPU, 1 GB RAM each)
- OR up to 4 ARM-based Ampere A1 cores and 24 GB memory

**Storage:**
- 2 Block Volumes (200 GB total)
- 10 GB Object Storage
- 10 GB Archive Storage

**Networking:**
- 10 TB outbound data transfer/month
- All inbound data transfer is free

**Database:**
- 2 Autonomous Databases (20 GB each)

**You're only using 1 VM, so well within limits!**

---

## Security Best Practices

### 1. Keep System Updated

```bash
ssh -i ~/.ssh/oracle-chat-server.key ubuntu@yourname.duckdns.org
sudo apt update && sudo apt upgrade -y
```

### 2. Secure SSH (Optional but Recommended)

Edit SSH config:
```bash
sudo nano /etc/ssh/sshd_config
```

Add/change:
```
PermitRootLogin no
PasswordAuthentication no
```

Restart SSH:
```bash
sudo systemctl restart sshd
```

### 3. Monitor MongoDB Access

MongoDB Atlas → Network Access → Whitelist your Oracle Cloud IP

### 4. Set Up Backups

Oracle Cloud → Compute → Block Volume → Enable automatic backups

---

## Troubleshooting

### Can't SSH into instance?

```bash
# Check key permissions
chmod 400 ~/.ssh/oracle-chat-server.key

# Try with IP directly
ssh -i ~/.ssh/oracle-chat-server.key ubuntu@YOUR_ORACLE_IP

# Verbose mode for debugging
ssh -v -i ~/.ssh/oracle-chat-server.key ubuntu@YOUR_ORACLE_IP
```

### Can't access website (timeout)?

**Check Oracle Cloud Security List:**
1. Instance → Virtual cloud network → Public Subnet → Security List
2. Ensure ports 80 and 443 are open

**Check Ubuntu firewall:**
```bash
sudo iptables -L -n
# Should show ACCEPT rules for ports 80 and 443
```

**Re-apply firewall rules:**
```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

### Backend not accessible?

```bash
# Check PM2
pm2 status
pm2 logs chat-server

# Check Nginx
sudo systemctl status nginx
sudo nginx -t

# Check if port 3001 is listening
sudo netstat -tlnp | grep 3001
```

### WebSocket not working?

- Verify SSL is properly configured (wss:// requires https://)
- Check Nginx WebSocket headers are present
- Check browser console for errors

### MongoDB connection failed?

```bash
# Check .env file
cat /var/www/chat-app/.env

# Check PM2 logs for errors
pm2 logs chat-server

# MongoDB Atlas → Network Access → Add Oracle Cloud IP
```

---

## Upgrading Beyond Free Tier

If your app grows, Oracle Cloud makes it easy to upgrade:

1. **More compute**: Upgrade to larger shapes
2. **Load balancing**: Add load balancer (also has free tier!)
3. **ARM instances**: Use ARM VMs for better performance (24GB RAM free!)
4. **Database**: Use Oracle Autonomous Database (2 free DBs)

But for a chat app, the free tier should be more than enough!

---

## Next Steps

Your chat app is now live and FREE FOREVER! 🎉

**Things to do:**
1. ✅ Share your Vercel URL with friends
2. ✅ Monitor Oracle Cloud dashboard
3. ✅ Check MongoDB Atlas for messages
4. ✅ Add more features to your app
5. ✅ Enjoy never paying for hosting!

**Future enhancements:**
- Add emoji support
- Typing indicators
- User avatars
- Multiple chat rooms
- Message reactions
- File uploads

Congratulations on your deployment! 🚀
