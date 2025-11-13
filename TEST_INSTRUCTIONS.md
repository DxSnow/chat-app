# Application Testing Guide

[中文文档](./TEST_INSTRUCTIONS.zh.md)

## 🔧 Recently Fixed Issues

Fixed API errors when no MongoDB connection is configured. Now the API works properly even without database configuration.

---

## 🔄 Restart Backend Server

**In the backend terminal (the one running `npm start`):**

1. Press `Ctrl + C` to stop the server
2. Restart:
   ```bash
   npm start
   ```

**Frontend does not need restart**, keep it running.

---

## ✅ Testing Steps

### 1. Check Service Status

**Backend terminal should show:**

```
Server running on http://localhost:3001
WebSocket server running on ws://localhost:3001
No MONGODB_URI found. Running in memory-only mode.
```

**Frontend terminal should show:**

```
VITE v7.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

### 2. Open Browser

Visit: **http://localhost:5173/**

You should see:

- ✅ Chat interface
- ✅ "Chat" displayed at top
- ✅ Connection status in top-right corner (green dot = Connected)
- ✅ Input box and send button at bottom

### 3. Test Single Window Chat

Type a message in the input box, click "Send" or press Enter:

- ✅ Message displays on the right (blue bubble)
- ✅ Shows send time
- ✅ Auto-scrolls to latest message

### 4. Test Multi-Window Real-time Chat

**Open a second browser window/tab:**

1. Visit http://localhost:5173/
2. Send a message in the first window
3. Second window should **receive the message in real-time** (left side, white bubble)
4. Reply in the second window
5. First window should receive it in real-time

### 5. Test Connection Status

1. Stop the backend server (Ctrl+C)
2. Browser top-right corner should change to red dot "Disconnected"
3. Restart the backend server
4. Should auto-reconnect, change back to green dot "Connected"

### 6. Test Page Refresh

**Without MongoDB configured:**

- Refresh page, messages disappear (memory mode)

**After configuring MongoDB:**

- Refresh page, messages persist
- Message history loads automatically

---

## 📱 Test Responsive Design

### Desktop View

- Message width max 60%
- Input box and button side by side

### Resize Browser Window (simulate mobile)

1. Press `Command + Option + I` to open developer tools
2. Click device emulation icon (phone icon)
3. Select iPhone or other device
4. Check:
   - ✅ Message width max 70%
   - ✅ Interface adapts
   - ✅ Touch-friendly

---

## 🎯 Expected Results

### ✅ Features That Should Work

- [x] Send messages
- [x] Receive messages
- [x] Real-time communication
- [x] Connection status display
- [x] Message timestamps
- [x] Auto-scroll
- [x] Responsive design
- [x] API doesn't error (even without MongoDB)

### ℹ️ Memory Mode Limitations

- [ ] Restart backend, messages lost
- [ ] Refresh page, messages lost

To solve this, need to configure MongoDB (see below)

---

## 🔧 Common Issues

### Issue: Connection status always red

**Check:**

```bash
# Is backend running?
lsof -ti:3001

# Any errors in browser console?
# Press F12 to check
```

### Issue: Can't send messages

**Check:**

1. Is connection status green?
2. Any errors in browser console (F12)?
3. Any error logs in backend terminal?

### Issue: Second window doesn't receive messages

**Check:**

1. Are both windows' connection status green?
2. Does backend terminal show "New client connected"?

---

## 🗄️ Optional: Configure MongoDB (Persistent Storage)

If you want messages to persist after restart:

1. Visit https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Edit `server/.env`:
   ```
   MONGODB_URI=your-connection-string
   ```
5. Restart backend server

---

## 📊 Testing Checklist

Complete these tests to confirm the application works properly:

- [ ] Backend server starts successfully
- [ ] Frontend application starts successfully
- [ ] Browser can access http://localhost:5173/
- [ ] Chat interface displays
- [ ] Connection status shows green
- [ ] Can send messages
- [ ] Messages display on right (blue)
- [ ] Open second window
- [ ] Second window receives messages in real-time (left white)
- [ ] Two windows can chat with each other
- [ ] Responsive design works properly
- [ ] No console errors

---

## 🎉 After Tests Pass

Congratulations! Your chat application is fully functional!

**Next steps:**

- Configure MongoDB for message persistence
- Customize interface styles
- Add user authentication
- Deploy to production environment

Enjoy your application! 🚀
