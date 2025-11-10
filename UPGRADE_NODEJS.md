# Node.js 升级指南

你当前的 Node.js 版本是 **v16.14.0**,建议升级到 **v20.x LTS** 或 **v22.x** 以获得最佳性能。

## 方法 1: 使用 nvm (推荐)

nvm (Node Version Manager) 可以让你轻松管理多个 Node.js 版本。

### 安装 nvm

在终端执行:

```bash
# 下载并安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

### 配置 shell

安装完成后,重新加载配置:

```bash
# 如果你使用 bash
source ~/.bashrc

# 如果你使用 zsh (macOS 默认)
source ~/.zshrc
```

或者直接关闭并重新打开终端。

### 验证安装

```bash
nvm --version
# 应该显示: 0.39.7
```

### 安装 Node.js 20 LTS

```bash
# 安装最新的 LTS 版本
nvm install 20

# 设置为默认版本
nvm alias default 20

# 使用这个版本
nvm use 20
```

### 验证升级

```bash
node --version
# 应该显示: v20.x.x

npm --version
# 应该显示: 10.x.x
```

### 安装 Node.js 22 (最新版本,可选)

```bash
# 安装 Node.js 22
nvm install 22

# 设置为默认
nvm alias default 22

# 使用
nvm use 22
```

---

## 方法 2: 使用 Homebrew (如果你已安装 Homebrew)

### 检查是否有 Homebrew

```bash
brew --version
```

### 如果有 Homebrew,升级 Node.js

```bash
# 卸载旧版本
brew uninstall node

# 安装最新版本
brew install node@20

# 或安装 Node.js 22
brew install node

# 链接
brew link node@20 --force --overwrite
```

### 验证

```bash
node --version
npm --version
```

---

## 方法 3: 从 Node.js 官网下载安装包

### 下载

访问: https://nodejs.org/

选择:
- **LTS 版本** (推荐): v20.x - 长期支持,稳定
- **Current 版本**: v22.x - 最新功能

### 安装

1. 下载 macOS 安装包 (.pkg)
2. 双击安装包
3. 按照安装向导完成安装
4. 重启终端

### 验证

```bash
node --version
npm --version
```

---

## 升级后的操作

### 1. 重新安装项目依赖

由于 Node.js 版本变化,建议重新安装依赖:

```bash
# 进入前端目录
cd /Users/xuedong/code/chat-website/client
rm -rf node_modules package-lock.json
npm install

# 进入后端目录
cd /Users/xuedong/code/chat-website/server
rm -rf node_modules package-lock.json
npm install
```

### 2. 验证项目运行

**启动后端:**
```bash
cd /Users/xuedong/code/chat-website/server
npm start
```

**启动前端:**
```bash
cd /Users/xuedong/code/chat-website/client
npm run dev
```

---

## 推荐版本

| 版本 | 说明 | 适用场景 |
|------|------|----------|
| **v20.x LTS** | 长期支持版本 | 生产环境,稳定项目 |
| v22.x | 最新稳定版 | 尝试新功能 |
| v18.x LTS | 旧的 LTS | 兼容性考虑 |

## 我的推荐

**使用 nvm 安装 Node.js 20 LTS**

原因:
- ✅ 稳定可靠
- ✅ 长期支持
- ✅ 性能优秀
- ✅ 可以轻松切换版本

---

## 常见问题

### Q: 升级后会影响其他项目吗?

使用 nvm 不会影响,可以为每个项目使用不同版本。在项目根目录创建 `.nvmrc` 文件:

```bash
echo "20" > .nvmrc
```

然后在项目目录执行:
```bash
nvm use
```

### Q: npm 需要单独升级吗?

不需要,安装新的 Node.js 会自动包含新版本的 npm。

### Q: 升级失败怎么办?

如果遇到问题:
1. 完全卸载当前 Node.js
2. 重启电脑
3. 重新安装

---

## 快速升级命令(推荐)

如果你想快速升级,复制以下命令:

```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# 重新加载 shell 配置
source ~/.zshrc  # 或 source ~/.bashrc

# 安装 Node.js 20 LTS
nvm install 20
nvm alias default 20
nvm use 20

# 验证
node --version
npm --version

# 重新安装项目依赖
cd /Users/xuedong/code/chat-website/client && rm -rf node_modules package-lock.json && npm install
cd /Users/xuedong/code/chat-website/server && rm -rf node_modules package-lock.json && npm install
```

---

## 升级后的好处

1. ✅ 更好的性能
2. ✅ 更多的 JavaScript 特性
3. ✅ 更好的安全性
4. ✅ 消除依赖警告
5. ✅ 支持最新的包

---

需要帮助?随时提问!
