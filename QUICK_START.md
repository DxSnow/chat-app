# Quick Start Guide

[中文文档](./QUICK_START.zh.md)

## First Time Setup

### 1. Install All Dependencies

Open terminal and run in project root directory:

```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### 2. Start Backend Server

In the first terminal window:

```bash
cd server
npm start
```

You should see:
```
Server running on http://localhost:3001
WebSocket server running on ws://localhost:3001
No MONGODB_URI found. Running in memory-only mode.
```

### 3. Start Frontend Application

Open a second terminal window:

```bash
cd client
npm run dev
```

You should see:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 4. Open Browser

Visit: http://localhost:5173/

## Test Chat Features

1. Open two browser windows/tabs
2. Both visit http://localhost:5173/
3. Send a message in one window
4. The other window will receive the message in real-time

## Optional: Configure MongoDB

If you want to persist messages (not lost after restart):

1. Visit https://www.mongodb.com/cloud/atlas
2. Create a free account and cluster
3. Get connection string
4. Add to `server/.env` file:
   ```
   MONGODB_URI=your-connection-string
   ```
5. Restart the server

## PWA Feature Testing

### Testing on Mobile

1. Ensure phone and computer are on the same WiFi
2. Modify WebSocket URL in `client/src/App.tsx`:
   ```typescript
   chatStore.connectWebSocket('ws://your-computer-ip:3001');
   ```
3. Visit on mobile browser: http://your-computer-ip:5173/
4. Tap "Add to Home Screen"

### Testing on Desktop

1. Visit the app in Chrome browser
2. An install icon will appear in the address bar
3. Click to install

## Common Issues

### WebSocket Connection Failed?

- Ensure backend server is running (port 3001)
- Check browser console for error messages

### Page Styles Broken?

- Ensure Tailwind CSS is properly installed
- Clear browser cache and retry

### Messages Not Updating in Real-time?

- Check network connection
- View WebSocket status in browser console
- Confirm "Connected" (green dot) in top-right corner

## Next Steps

- Read complete [README.md](./README.md)
- Customize chat interface styles
- Add user authentication
- Deploy to production environment

## Need Help?

Check project Issues or create a new Issue to ask questions.
