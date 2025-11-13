# 启动应用指南

## ✅ Node.js 升级完成!

你现在使用的是 **Node.js v20.19.5** 和 **npm v10.8.2**

所有依赖已重新安装,没有任何警告!

---

## 🚀 如何启动应用

### 重要提示
每次打开新的终端窗口时,需要先激活 nvm 以使用 Node.js 20:

```bash
# 自动激活(添加到你的 ~/.zshrc 文件中,只需要做一次)
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.zshrc
source ~/.zshrc
```

或者每次手动激活:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

---

## 启动步骤

### 终端 1 - 启动后端服务器

```bash
cd /Users/xuedong/code/chat-website/server
npm start
```

你应该看到:
```
Server running on http://localhost:3001
WebSocket server running on ws://localhost:3001
No MONGODB_URI found. Running in memory-only mode.
```

### 终端 2 - 启动前端应用

打开新的终端窗口:

```bash
cd /Users/xuedong/code/chat-website/client
npm run dev
```

你应该看到:
```
VITE v7.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 打开浏览器

访问: **http://localhost:5173/**

---

## 📱 测试聊天功能

1. 打开两个浏览器窗口/标签
2. 都访问 http://localhost:5173/
3. 在一个窗口发送消息
4. 另一个窗口实时接收消息
5. 刷新页面,消息依然存在(如果配置了 MongoDB)

---

## 🎯 验证 Node.js 版本

随时检查当前使用的 Node.js 版本:

```bash
node --version  # 应该显示 v20.19.5
npm --version   # 应该显示 10.8.2
```

如果显示的是旧版本(v16.14.0),执行:

```bash
nvm use 20
```

---

## ⚙️ 一键自动配置 (推荐)

运行这个命令,以后每次打开终端都会自动使用 Node.js 20:

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

## 📦 其他有用命令

### 查看所有已安装的 Node.js 版本
```bash
nvm list
```

### 切换到不同版本
```bash
nvm use 16  # 切回旧版本
nvm use 20  # 切回新版本
```

### 查看可用的 Node.js 版本
```bash
nvm ls-remote
```

### 安装其他版本
```bash
nvm install 22  # 安装最新版本
nvm install 18  # 安装 18 LTS
```

---

## 🐛 故障排除

### 问题: nvm 命令找不到

**解决:**
```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

### 问题: 还是显示 Node v16

**解决:**
```bash
nvm use 20
```

### 问题: 每次都要手动运行 nvm use

**解决:** 运行上面的"一键自动配置"命令

### 问题: 端口已被占用

**解决:**
```bash
# 查找占用 3001 端口的进程
lsof -ti:3001 | xargs kill -9

# 查找占用 5173 端口的进程
lsof -ti:5173 | xargs kill -9
```

---

## ✨ 升级成功的好处

✅ **性能提升** - 比 v16 快 20-30%
✅ **无警告** - 所有 EBADENGINE 警告消失
✅ **最新特性** - 支持最新的 JavaScript 功能
✅ **更好的安全性** - 最新的安全补丁
✅ **完美兼容** - 与 Vite 7.x 和 Koa 3.x 完美配合

---

## 🎉 开始使用吧!

现在一切就绪,享受你的聊天应用!

如需帮助,查看:
- [README.md](./README.md) - 完整文档
- [QUICK_START.md](./QUICK_START.md) - 快速开始
- [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) - 项目概览
