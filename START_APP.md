# Application Startup Guide

[中文文档](./START_APP.zh.md)

## ✅ Node.js Upgrade Complete!

You are now using **Node.js v20.19.5** and **npm v10.8.2**

All dependencies have been reinstalled with no warnings!

---

## 🚀 How to Start the Application

### Important Note
Each time you open a new terminal window, you need to activate nvm to use Node.js 20:

```bash
# Auto-activate (add to your ~/.zshrc file, only needed once)
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.zshrc
source ~/.zshrc
```

Or manually activate each time:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

---

## Startup Steps

### Terminal 1 - Start Backend Server

```bash
cd /Users/xuedong/code/chat-app/server
npm start
```

You should see:
```
Server running on http://localhost:3001
WebSocket server running on ws://localhost:3001
No MONGODB_URI found. Running in memory-only mode.
```

### Terminal 2 - Start Frontend Application

Open a new terminal window:

```bash
cd /Users/xuedong/code/chat-app/client
npm run dev
```

You should see:
```
VITE v7.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Open Browser

Visit: **http://localhost:5173/**

---

## 📱 Test Chat Features

1. Open two browser windows/tabs
2. Both visit http://localhost:5173/
3. Send a message in one window
4. The other window receives the message in real-time
5. Refresh page, messages persist (if MongoDB is configured)

---

## 🎯 Verify Node.js Version

Check current Node.js version at any time:

```bash
node --version  # Should show v20.19.5
npm --version   # Should show 10.8.2
```

If it shows the old version (v16.14.0), run:

```bash
nvm use 20
```

---

## ⚙️ One-Click Auto Configuration (Recommended)

Run this command so that Node.js 20 is automatically used every time you open a terminal:

```bash
cat >> ~/.zshrc << 'EOF'

# NVM Configuration
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
EOF

source ~/.zshrc
```

---

## 📦 Other Useful Commands

### View All Installed Node.js Versions
```bash
nvm list
```

### Switch to Different Version
```bash
nvm use 16  # Switch back to old version
nvm use 20  # Switch to new version
```

### View Available Node.js Versions
```bash
nvm ls-remote
```

### Install Other Versions
```bash
nvm install 22  # Install latest version
nvm install 18  # Install 18 LTS
```

---

## 🐛 Troubleshooting

### Issue: nvm command not found

**Solution:**
```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

### Issue: Still showing Node v16

**Solution:**
```bash
nvm use 20
```

### Issue: Need to run nvm use every time

**Solution:** Run the "One-Click Auto Configuration" command above

### Issue: Port already in use

**Solution:**
```bash
# Find and kill process using port 3001
lsof -ti:3001 | xargs kill -9

# Find and kill process using port 5173
lsof -ti:5173 | xargs kill -9
```

---

## ✨ Benefits of the Upgrade

✅ **Performance Boost** - 20-30% faster than v16
✅ **No Warnings** - All EBADENGINE warnings gone
✅ **Latest Features** - Support for latest JavaScript features
✅ **Better Security** - Latest security patches
✅ **Perfect Compatibility** - Works perfectly with Vite 7.x and Koa 3.x

---

## 🎉 Start Using!

Everything is ready, enjoy your chat application!

For help, check:
- [README.md](./README.md) - Complete documentation
- [QUICK_START.md](./QUICK_START.md) - Quick start
- [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) - Project overview
