# Quick Deploy Guide - Oracle Cloud Always Free

Deploy your chat app on Oracle Cloud - **FREE FOREVER**!

## Why Oracle Cloud?

✅ **FREE FOREVER** (not 12 months)
✅ **Better than AWS free tier**
✅ **No expiration date**
✅ **2 VMs with 1GB RAM each**
✅ **200 GB storage**
✅ **10 TB data transfer/month**

**Total Cost: $0 FOREVER** 🎉

---

## 30-Minute Deployment Checklist

### ☐ Step 1: DuckDNS Domain (2 min)

1. https://www.duckdns.org
2. Sign in → Create subdomain
3. Save token
4. Get: `yourname.duckdns.org`

---

### ☐ Step 2: Oracle Cloud Account (10 min)

1. https://www.oracle.com/cloud/free/
2. Click "Start for free"
3. Fill details, verify email
4. Add credit card (verification only - won't charge!)
5. Wait for approval (~5-10 min)

---

### ☐ Step 3: Create Instance (5 min)

**Quick Config:**
```
1. Oracle Cloud Console → ☰ → Compute → Instances
2. Create Instance

Name: chat-server

Image:
  → Change Image → Ubuntu 22.04 → Select

Shape:
  → Change Shape → Specialty and previous generation
  → VM.Standard.E2.1.Micro (Always Free) → Select

Networking:
  ✓ Assign public IPv4 address

SSH Keys:
  → Save Private Key (DOWNLOAD AND SAVE!)
  → Save Public Key

3. Create
4. Wait for "Running" (green)
5. SAVE PUBLIC IP!
```

---

### ☐ Step 4: Open Firewall Ports (3 min)

**In Oracle Cloud Console:**

```
1. Instance page → Virtual cloud network (click link)
2. Public Subnet → Security List
3. Add Ingress Rules (add these 2 rules):

Rule 1:
  Source: 0.0.0.0/0
  Protocol: TCP
  Port: 80

Rule 2:
  Source: 0.0.0.0/0
  Protocol: TCP
  Port: 443
```

---

### ☐ Step 5: Point DuckDNS to Oracle (1 min)

1. Back to https://www.duckdns.org
2. Paste Oracle IP in "current ip"
3. Update ip

---

### ☐ Step 6: SSH and Setup (10 min)

**Prepare key:**
```bash
mv ~/Downloads/ssh-key-*.key ~/.ssh/oracle-chat-server.key
chmod 400 ~/.ssh/oracle-chat-server.key
```

**SSH in:**
```bash
ssh -i ~/.ssh/oracle-chat-server.key ubuntu@yourname.duckdns.org
```

**Open Ubuntu firewall:**
```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo apt-get install -y iptables-persistent
# Choose "Yes" to save rules
```

**Install everything:**
```bash
# Update
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install dependencies
sudo apt install -y nginx certbot python3-certbot-nginx git
sudo npm install -g pm2

# Verify
node --version
```

---

### ☐ Step 7: Deploy Backend (5 min)

```bash
# Create directory
sudo mkdir -p /var/www/chat-app
sudo chown -R ubuntu:ubuntu /var/www/chat-app
cd /var/www/chat-app

# Clone code
git clone YOUR_GITHUB_REPO .

# Create .env
nano .env
```

Paste:
```env
PORT=3001
MONGODB_URI=your_mongodb_uri_here
```

Save: `Ctrl+X`, `Y`, `Enter`

```bash
# Install and start
npm install
pm2 start index.js --name chat-server
pm2 startup systemd
# Run the command it outputs
pm2 save
```

---

### ☐ Step 8: Configure Nginx (3 min)

```bash
sudo nano /etc/nginx/sites-available/chat-app
```

Paste (replace domain):
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
sudo ln -s /etc/nginx/sites-available/chat-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

### ☐ Step 9: Setup SSL (2 min)

```bash
sudo certbot --nginx -d yourname.duckdns.org
# Enter email, agree, choose redirect (option 2)
```

---

### ☐ Step 10: Deploy Frontend - Vercel (5 min)

1. https://vercel.com
2. Import GitHub repo
3. Configure:
   ```
   Root: client
   Build: npm run build
   Output: dist
   ```
4. Environment Variables:
   ```
   VITE_API_URL=https://yourname.duckdns.org
   VITE_WS_URL=wss://yourname.duckdns.org
   ```
5. Deploy!

---

## ✅ Done!

Visit your Vercel URL → Enter nickname → Chat! 🎉

---

## Quick Commands

### Server Management

```bash
# SSH
ssh -i ~/.ssh/oracle-chat-server.key ubuntu@yourname.duckdns.org

# Status
pm2 status

# Logs
pm2 logs chat-server

# Restart
pm2 restart chat-server

# Update
cd /var/www/chat-app && git pull && npm install && pm2 restart chat-server
```

### Oracle Cloud Console

**Stop instance (saves resources):**
```
Compute → Instances → Select → Stop
```

**Start instance:**
```
Compute → Instances → Select → Start
(IP may change - update DuckDNS!)
```

---

## Troubleshooting

### Can't access website?

**Re-apply firewall rules:**
```bash
ssh -i ~/.ssh/oracle-chat-server.key ubuntu@yourname.duckdns.org
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

**Check Oracle Security List:**
```
Instance → VCN → Subnet → Security List
Ensure ports 80, 443 are in Ingress Rules
```

### Backend not working?

```bash
pm2 logs chat-server
sudo systemctl status nginx
```

### MongoDB connection failed?

```
MongoDB Atlas → Network Access → Add Oracle Cloud IP
```

---

## Cost Summary

| Service | Cost |
|---------|------|
| Oracle Cloud | **$0 FOREVER** |
| DuckDNS | **$0 FOREVER** |
| Vercel | **$0 FOREVER** |
| MongoDB | **$0 FOREVER** |
| SSL | **$0 FOREVER** |

**Total: $0/month** 🎉

---

## Always Free Limits

You get **FOREVER**:
- 2 AMD VMs (1GB each) or 4 ARM VMs (24GB total!)
- 200 GB storage
- 10 TB data transfer/month
- **Never expires!**

---

## Next Steps

1. ✅ Test your app
2. ✅ Share with friends
3. ✅ Add more features
4. ✅ Enjoy FREE hosting forever!

For detailed guide, see [DEPLOYMENT_ORACLE.md](DEPLOYMENT_ORACLE.md)

**Your app is live and FREE FOREVER!** 🚀
