# Chat Application - Deployment Guide

Your chat application is ready to deploy on **Oracle Cloud Always Free Tier** - **FREE FOREVER**!

## 🎉 Why Oracle Cloud?

| Feature | Oracle Cloud | AWS | DigitalOcean |
|---------|--------------|-----|--------------|
| **Free Period** | FOREVER ✅ | 12 months | $0 |
| **Cost After** | $0 FOREVER | ~$9/month | $4/month |
| **VM RAM** | 1 GB | 1 GB | 512 MB ($4 plan) |
| **Storage** | 200 GB | 30 GB (12mo) | Paid |
| **Data Transfer** | 10 TB/month | 15 GB/month (12mo) | Paid |
| **Best For** | **Always FREE** | First year | Budget hosting |

**Winner: Oracle Cloud** - FREE FOREVER! 🏆

---

## 📚 Available Deployment Guides

### Oracle Cloud (Recommended - FREE FOREVER)

| Guide | Purpose | Time |
|-------|---------|------|
| **[DEPLOYMENT_ORACLE.md](DEPLOYMENT_ORACLE.md)** | Complete step-by-step guide | 40 min |
| **[QUICK_DEPLOY_ORACLE.md](QUICK_DEPLOY_ORACLE.md)** | Quick deployment checklist | 30 min |
| **[deploy-setup-oracle.sh](server/deploy-setup-oracle.sh)** | Automated setup script | Run on Oracle instance |

### AWS (If You Have Free Tier Available)

| Guide | Purpose |
|-------|---------|
| **[DEPLOYMENT_AWS.md](DEPLOYMENT_AWS.md)** | Complete AWS EC2 guide |
| **[QUICK_DEPLOY_AWS.md](QUICK_DEPLOY_AWS.md)** | Quick AWS deployment |
| **[deploy-setup-aws.sh](server/deploy-setup-aws.sh)** | AWS setup script |

### DigitalOcean (Original Guide - $4/month)

| Guide | Purpose |
|-------|---------|
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | Complete DigitalOcean guide |
| **[QUICK_DEPLOY.md](QUICK_DEPLOY.md)** | Quick DigitalOcean deployment |
| **[deploy-setup.sh](server/deploy-setup.sh)** | DigitalOcean setup script |

---

## ✅ What's Already Done

### 1. Application Code
- ✅ Nickname system with localStorage
- ✅ Real-time WebSocket messaging
- ✅ MongoDB persistence
- ✅ Production-ready configuration
- ✅ Environment variable support

### 2. Frontend
- ✅ React + TypeScript + Vite
- ✅ Tailwind CSS styling
- ✅ MobX state management
- ✅ PWA support
- ✅ Ready for Vercel deployment

### 3. Backend
- ✅ Koa server
- ✅ WebSocket (ws library)
- ✅ MongoDB Atlas connection
- ✅ CORS configured
- ✅ Production-ready

---

## 🚀 Quick Start - Oracle Cloud (30 minutes)

### Step 1: Get Free Services (5 min)

**DuckDNS (Free Domain):**
1. https://www.duckdns.org
2. Sign in, create subdomain
3. Get: `yourname.duckdns.org`

**Oracle Cloud (Free VM):**
1. https://www.oracle.com/cloud/free/
2. Sign up (requires credit card for verification - won't charge!)
3. Wait for approval (~10 min)

### Step 2: Create Instance (5 min)

1. Oracle Cloud Console → Compute → Instances → Create
2. **Name:** `chat-server`
3. **Image:** Ubuntu 22.04
4. **Shape:** VM.Standard.E2.1.Micro (Always Free)
5. **Network:** ✓ Assign public IP
6. **SSH:** Save private key (IMPORTANT!)
7. Create → Save public IP

### Step 3: Configure Networking (3 min)

**Oracle Cloud Security List:**
1. Instance → VCN → Subnet → Security List
2. Add Ingress Rules:
   - Port 80 (HTTP)
   - Port 443 (HTTPS)

### Step 4: Deploy (15 min)

**SSH into instance:**
```bash
ssh -i ~/path/to/key.key ubuntu@your-oracle-ip
```

**Run automated setup:**
```bash
# Quick setup
curl -fsSL https://raw.githubusercontent.com/YOUR_REPO/main/server/deploy-setup-oracle.sh | bash

# Or manual - see DEPLOYMENT_ORACLE.md
```

**Deploy app:**
```bash
cd /var/www/chat-app
git clone YOUR_REPO .
nano .env  # Add MongoDB URI
npm install
pm2 start index.js --name chat-server
```

**Configure Nginx + SSL:**
```bash
# See QUICK_DEPLOY_ORACLE.md for Nginx config
sudo certbot --nginx -d yourname.duckdns.org
```

### Step 5: Deploy Frontend to Vercel (5 min)

1. https://vercel.com
2. Import from GitHub
3. Root: `client`, Build: `npm run build`, Output: `dist`
4. Add env vars:
   - `VITE_API_URL=https://yourname.duckdns.org`
   - `VITE_WS_URL=wss://yourname.duckdns.org`
5. Deploy!

**🎉 DONE! Your app is live and FREE FOREVER!**

---

## 💰 Cost Comparison

### Oracle Cloud (Recommended)

```
Backend (Oracle Cloud):     $0/month FOREVER
Frontend (Vercel):          $0/month FOREVER
Database (MongoDB Atlas):   $0/month FOREVER
Domain (DuckDNS):           $0/month FOREVER
SSL (Let's Encrypt):        $0/month FOREVER
───────────────────────────────────────────
Total:                      $0/month FOREVER
```

### AWS

```
Backend (EC2 t2.micro):     $0 first 12 months, then ~$9/month
Frontend (Vercel):          $0/month FOREVER
Database (MongoDB Atlas):   $0/month FOREVER
Domain (DuckDNS):           $0/month FOREVER
SSL (Let's Encrypt):        $0/month FOREVER
───────────────────────────────────────────
Total:                      $0 first year, then $9/month
```

### DigitalOcean

```
Backend (Droplet):          $4/month from day 1
Frontend (Vercel):          $0/month FOREVER
Database (MongoDB Atlas):   $0/month FOREVER
Domain (DuckDNS):           $0/month FOREVER
SSL (Let's Encrypt):        $0/month FOREVER
───────────────────────────────────────────
Total:                      $4/month ($48/year)
```

**Winner: Oracle Cloud saves you $48-108/year!** 💰

---

## 📖 Which Guide Should You Use?

### New to Cloud Deployment?
→ **[DEPLOYMENT_ORACLE.md](DEPLOYMENT_ORACLE.md)** - Detailed with explanations

### Want It Fast?
→ **[QUICK_DEPLOY_ORACLE.md](QUICK_DEPLOY_ORACLE.md)** - 30-minute checklist

### Experienced Developer?
→ Run **[deploy-setup-oracle.sh](server/deploy-setup-oracle.sh)** + follow checklist

---

## 🔧 Tech Stack

### Frontend
- React 19 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- MobX (state management)
- PWA support

### Backend
- Node.js + Koa
- WebSocket (ws library)
- MongoDB + Mongoose
- PM2 (process manager)
- Nginx (reverse proxy)

### Infrastructure
- Oracle Cloud Always Free (compute)
- Vercel (frontend hosting)
- MongoDB Atlas (database)
- DuckDNS (free domain)
- Let's Encrypt (SSL)

---

## 📝 Environment Variables

### Frontend (.env or Vercel dashboard)
```env
VITE_API_URL=https://yourname.duckdns.org
VITE_WS_URL=wss://yourname.duckdns.org
```

### Backend (server/.env)
```env
PORT=3001
MONGODB_URI=mongodb+srv://...
```

---

## 🛠️ Useful Commands

### Server Management
```bash
# SSH into Oracle Cloud
ssh -i ~/.ssh/oracle-key.key ubuntu@yourname.duckdns.org

# Check app status
pm2 status

# View logs
pm2 logs chat-server

# Restart app
pm2 restart chat-server

# Update app
cd /var/www/chat-app && git pull && npm install && pm2 restart chat-server
```

### Frontend Deployment
```bash
# Vercel auto-deploys on git push!
git add .
git commit -m "Update"
git push origin main
```

---

## 🐛 Troubleshooting

### Can't access website?

**Check Oracle Cloud Security List:**
- Instance → VCN → Subnet → Security List
- Ensure ports 80, 443 in Ingress Rules

**Check Ubuntu firewall:**
```bash
ssh -i ~/.ssh/oracle-key.key ubuntu@your-ip
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
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

See full troubleshooting in [DEPLOYMENT_ORACLE.md](DEPLOYMENT_ORACLE.md)

---

## 🎯 Next Steps

### After Deployment:
1. ✅ Test your app thoroughly
2. ✅ Share Vercel URL with friends
3. ✅ Monitor Oracle Cloud dashboard
4. ✅ Set up MongoDB Atlas backups
5. ✅ Enjoy FREE hosting!

### Future Enhancements:
- [ ] Add emoji picker
- [ ] Typing indicators
- [ ] User avatars
- [ ] Multiple chat rooms
- [ ] Message reactions
- [ ] File/image uploads
- [ ] Message search
- [ ] Dark mode

---

## 📞 Getting Started

**Ready to deploy? Follow these steps:**

1. **Get DuckDNS domain** → https://www.duckdns.org
2. **Create Oracle Cloud account** → https://www.oracle.com/cloud/free/
3. **Follow deployment guide** → [DEPLOYMENT_ORACLE.md](DEPLOYMENT_ORACLE.md)

**Questions? Check:**
- [DEPLOYMENT_ORACLE.md](DEPLOYMENT_ORACLE.md) - Complete guide
- [QUICK_DEPLOY_ORACLE.md](QUICK_DEPLOY_ORACLE.md) - Quick reference

---

## 🎉 Summary

**Your chat app will be:**
- ✅ Live on the internet
- ✅ FREE forever (Oracle Cloud + Vercel + MongoDB Atlas)
- ✅ Secure (HTTPS with SSL)
- ✅ Fast (Global CDN)
- ✅ Scalable (Can upgrade anytime)

**Deployment time: ~30-40 minutes**

**Cost: $0/month FOREVER** 🚀

Let's get your app live! Start with [DEPLOYMENT_ORACLE.md](DEPLOYMENT_ORACLE.md)
