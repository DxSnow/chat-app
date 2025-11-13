# Chat App - 实时聊天应用

一个使用现代技术栈构建的实时聊天应用,支持 PWA 功能,可在手机和电脑上完美运行。

## 技术栈

### 前端
- **React** - UI 框架
- **TypeScript** - 类型安全
- **MobX** - 状态管理
- **Tailwind CSS** - 样式框架
- **Vite** - 构建工具
- **PWA** - 渐进式 Web 应用

### 后端
- **Koa.js** - Node.js Web 框架
- **WebSocket (ws)** - 实时通信
- **MongoDB** - 数据库(可选)
- **Mongoose** - MongoDB ODM

## 功能特性

- ✅ 实时消息发送和接收
- ✅ WebSocket 实时通信
- ✅ 消息历史记录
- ✅ 响应式设计(手机和电脑友好)
- ✅ PWA 支持(可安装到桌面)
- ✅ 离线消息缓存
- ✅ MongoDB 持久化存储(可选)
- ✅ 类似微信的聊天界面

## 项目结构

```
chat-website/
├── client/                 # 前端应用
│   ├── src/
│   │   ├── components/    # React 组件
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   └── MessageInput.tsx
│   │   ├── stores/        # MobX 状态管理
│   │   │   └── ChatStore.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   └── package.json
└── server/                # 后端服务器
    ├── index.js           # Koa 服务器 + WebSocket
    ├── .env.example       # 环境变量示例
    └── package.json
```

## 快速开始

### 环境要求

- Node.js >= 18.x (推荐使用最新 LTS 版本)
- npm >= 8.x

### 安装步骤

1. **克隆项目**
```bash
git clone <your-repo-url>
cd chat-website
```

2. **安装前端依赖**
```bash
cd client
npm install
```

3. **安装后端依赖**
```bash
cd ../server
npm install
```

4. **配置环境变量(可选)**
```bash
cd server
cp .env.example .env
# 编辑 .env 文件,添加 MongoDB 连接字符串
```

### 运行应用

1. **启动后端服务器**
```bash
cd server
npm start
```
服务器将在 `http://localhost:3001` 启动

2. **启动前端应用(新终端窗口)**
```bash
cd client
npm run dev
```
前端将在 `http://localhost:5173` 启动

3. **访问应用**

打开浏览器访问: `http://localhost:5173`

## MongoDB 配置

### 使用 MongoDB Atlas(推荐)

1. 访问 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. 创建免费集群
3. 获取连接字符串
4. 在 `server/.env` 中设置:
```
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/chat-app?retryWrites=true&w=majority
```

### 不使用数据库

如果不配置 MongoDB,应用将在内存模式下运行(重启后消息会丢失)。

## PWA 功能

### 在手机上安装

1. 在手机浏览器中打开应用
2. 点击浏览器菜单中的"添加到主屏幕"
3. 应用图标将出现在桌面上

### 功能特性

- 离线访问
- 消息缓存
- 类原生应用体验
- 启动画面
- 独立窗口运行

## 开发

### 前端开发
```bash
cd client
npm run dev    # 开发模式
npm run build  # 生产构建
npm run preview # 预览生产构建
```

### 后端开发
```bash
cd server
npm run dev    # 启动服务器
```

## 部署

### 前端部署(Vercel/Netlify)

1. 构建前端
```bash
cd client
npm run build
```

2. 部署 `dist` 目录到 Vercel 或 Netlify

3. 配置环境变量:更新 WebSocket 和 API URL

### 后端部署(Heroku/Railway)

1. 确保 `.env` 配置正确
2. 部署到 Heroku 或 Railway
3. 设置环境变量

## API 接口

### REST API

- `GET /api/messages` - 获取历史消息
- `POST /api/messages` - 保存新消息

### WebSocket

连接地址: `ws://localhost:3001`

消息格式:
```json
{
  "id": "msg-1234567890",
  "content": "Hello",
  "sender": "User",
  "timestamp": "2025-10-31T12:00:00.000Z",
  "isSelf": true
}
```

## 浏览器支持

- Chrome/Edge (最新版本)
- Firefox (最新版本)
- Safari (最新版本)
- 移动浏览器(iOS Safari, Chrome Android)

## 故障排除

### WebSocket 连接失败

1. 确保后端服务器正在运行
2. 检查防火墙设置
3. 确认 URL 配置正确

### MongoDB 连接错误

1. 检查连接字符串格式
2. 确认网络 IP 白名单
3. 验证用户名和密码

### PWA 无法安装

1. 确保使用 HTTPS(生产环境)
2. 检查 manifest.json 配置
3. 确认图标文件存在

## 贡献

欢迎提交 Issue 和 Pull Request!

## 许可证

MIT

## 联系方式

如有问题,请提交 Issue 或联系开发者。
