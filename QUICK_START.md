# 快速启动指南

## 第一次运行

### 1. 安装所有依赖

打开终端,在项目根目录执行:

```bash
# 安装客户端依赖
cd client
npm install

# 安装服务器依赖
cd ../server
npm install
```

### 2. 启动后端服务器

在第一个终端窗口:

```bash
cd server
npm start
```

你应该看到:
```
Server running on http://localhost:3001
WebSocket server running on ws://localhost:3001
No MONGODB_URI found. Running in memory-only mode.
```

### 3. 启动前端应用

打开第二个终端窗口:

```bash
cd client
npm run dev
```

你应该看到:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 4. 打开浏览器

访问: http://localhost:5173/

## 测试聊天功能

1. 打开两个浏览器窗口/标签页
2. 都访问 http://localhost:5173/
3. 在一个窗口发送消息
4. 另一个窗口会实时收到消息

## 可选:配置 MongoDB

如果想持久化消息(重启后不丢失):

1. 访问 https://www.mongodb.com/cloud/atlas
2. 创建免费账户和集群
3. 获取连接字符串
4. 在 `server/.env` 文件中添加:
   ```
   MONGODB_URI=你的连接字符串
   ```
5. 重启服务器

## PWA 功能测试

### 在手机上测试

1. 确保手机和电脑在同一 WiFi
2. 修改 `client/src/App.tsx` 中的 WebSocket URL:
   ```typescript
   chatStore.connectWebSocket('ws://你的电脑IP:3001');
   ```
3. 在手机浏览器访问: http://你的电脑IP:5173/
4. 点击"添加到主屏幕"

### 在桌面测试

1. Chrome 浏览器访问应用
2. 地址栏右侧会出现安装图标
3. 点击安装

## 常见问题

### WebSocket 连接失败?

- 确保后端服务器正在运行(端口 3001)
- 检查浏览器控制台错误信息

### 页面样式错乱?

- 确保 Tailwind CSS 已正确安装
- 清除浏览器缓存重试

### 消息没有实时更新?

- 检查网络连接
- 查看浏览器控制台的 WebSocket 状态
- 确认右上角显示"Connected"(绿点)

## 下一步

- 阅读完整 [README.md](./README.md)
- 自定义聊天界面样式
- 添加用户认证
- 部署到生产环境

## 需要帮助?

查看项目 Issues 或创建新的 Issue 提问。
