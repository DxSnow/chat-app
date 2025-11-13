# Node.js Upgrade Guide

[中文文档](./UPGRADE_NODEJS.zh.md)

Your current Node.js version is **v16.14.0**, recommend upgrading to **v20.x LTS** or **v22.x** for best performance.

## Method 1: Using nvm (Recommended)

nvm (Node Version Manager) allows you to easily manage multiple Node.js versions.

### Install nvm

Run in terminal:

```bash
# Download and install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

### Configure shell

After installation, reload configuration:

```bash
# If you use bash
source ~/.bashrc

# If you use zsh (macOS default)
source ~/.zshrc
```

Or simply close and reopen the terminal.

### Verify Installation

```bash
nvm --version
# Should show: 0.39.7
```

### Install Node.js 20 LTS

```bash
# Install latest LTS version
nvm install 20

# Set as default version
nvm alias default 20

# Use this version
nvm use 20
```

### Verify Upgrade

```bash
node --version
# Should show: v20.x.x

npm --version
# Should show: 10.x.x
```

### Install Node.js 22 (Latest version, optional)

```bash
# Install Node.js 22
nvm install 22

# Set as default
nvm alias default 22

# Use
nvm use 22
```

---

## Method 2: Using Homebrew (If you already have Homebrew)

### Check if Homebrew is installed

```bash
brew --version
```

### If you have Homebrew, upgrade Node.js

```bash
# Uninstall old version
brew uninstall node

# Install latest version
brew install node@20

# Or install Node.js 22
brew install node

# Link
brew link node@20 --force --overwrite
```

### Verify

```bash
node --version
npm --version
```

---

## Method 3: Download installer from Node.js official website

### Download

Visit: https://nodejs.org/

Choose:
- **LTS version** (recommended): v20.x - Long-term support, stable
- **Current version**: v22.x - Latest features

### Install

1. Download macOS installer (.pkg)
2. Double-click the installer
3. Follow installation wizard to complete
4. Restart terminal

### Verify

```bash
node --version
npm --version
```

---

## Post-Upgrade Steps

### 1. Reinstall Project Dependencies

Due to Node.js version change, recommend reinstalling dependencies:

```bash
# Enter frontend directory
cd /Users/xuedong/code/chat-app/client
rm -rf node_modules package-lock.json
npm install

# Enter backend directory
cd /Users/xuedong/code/chat-app/server
rm -rf node_modules package-lock.json
npm install
```

### 2. Verify Project Runs

**Start backend:**
```bash
cd /Users/xuedong/code/chat-app/server
npm start
```

**Start frontend:**
```bash
cd /Users/xuedong/code/chat-app/client
npm run dev
```

---

## Recommended Versions

| Version | Description | Use Case |
|---------|-------------|----------|
| **v20.x LTS** | Long-term support version | Production environment, stable projects |
| v22.x | Latest stable version | Try new features |
| v18.x LTS | Old LTS | Compatibility considerations |

## My Recommendation

**Use nvm to install Node.js 20 LTS**

Reasons:
- ✅ Stable and reliable
- ✅ Long-term support
- ✅ Excellent performance
- ✅ Easy version switching

---

## Common Questions

### Q: Will upgrading affect other projects?

Using nvm won't affect them, you can use different versions for each project. Create `.nvmrc` file in project root:

```bash
echo "20" > .nvmrc
```

Then in project directory run:
```bash
nvm use
```

### Q: Do I need to upgrade npm separately?

No, installing new Node.js automatically includes new npm version.

### Q: What if upgrade fails?

If you encounter issues:
1. Completely uninstall current Node.js
2. Restart computer
3. Reinstall

---

## Quick Upgrade Commands (Recommended)

If you want to upgrade quickly, copy these commands:

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Reload shell configuration
source ~/.zshrc  # or source ~/.bashrc

# Install Node.js 20 LTS
nvm install 20
nvm alias default 20
nvm use 20

# Verify
node --version
npm --version

# Reinstall project dependencies
cd /Users/xuedong/code/chat-app/client && rm -rf node_modules package-lock.json && npm install
cd /Users/xuedong/code/chat-app/server && rm -rf node_modules package-lock.json && npm install
```

---

## Post-Upgrade Benefits

1. ✅ Better performance
2. ✅ More JavaScript features
3. ✅ Better security
4. ✅ Eliminate dependency warnings
5. ✅ Support latest packages

---

Need help? Ask anytime!
