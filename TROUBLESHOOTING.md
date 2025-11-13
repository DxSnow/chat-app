# Blank Page Troubleshooting

[中文文档](./TROUBLESHOOTING.zh.md)

## 🔍 Diagnostic Steps

### 1. Open Browser Developer Tools

**Press `F12` or `Command + Option + I`**

### 2. Check Console Tab

Look for red error messages. Common errors:

#### Error A: "Failed to fetch" or WebSocket errors
**Cause:** Backend server not running
**Solution:** Ensure backend is running (`npm start` in server/)

#### Error B: MobX related errors
**Cause:** MobX configuration issue
**Solution:** See below

#### Error C: Tailwind CSS related errors
**Cause:** CSS loading failed
**Solution:** Already fixed, refresh page

#### Error D: Module loading errors
**Cause:** Dependency issue
**Solution:** Reinstall dependencies

### 3. Check Network Tab

1. Switch to Network tab
2. Refresh page (`Command + R`)
3. Look for failed requests (red)

---

## 🔧 Quick Fixes

### Fix 1: Clear Cache and Hard Refresh

**In browser, press:**
- Mac: `Command + Shift + R`
- Windows: `Ctrl + Shift + R`

Or:
1. Right-click the refresh button
2. Select "Empty Cache and Hard Reload"

### Fix 2: Restart Frontend Server

In frontend terminal:
```bash
# Ctrl + C to stop

# Restart
npm run dev
```

### Fix 3: Ensure Using Node 20

In frontend terminal:
```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20
node --version  # Should show v20.19.5

# Restart
npm run dev
```

### Fix 4: Clear Vite Cache

```bash
cd /Users/xuedong/code/chat-app/client
rm -rf node_modules/.vite
npm run dev
```

### Fix 5: Complete Dependency Reinstall

```bash
cd /Users/xuedong/code/chat-app/client
rm -rf node_modules package-lock.json node_modules/.vite
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20
npm install
npm run dev
```

---

## 📋 Checklist

Please check in order:

- [ ] Backend server is running (port 3001)
- [ ] Frontend server is running (port 5173)
- [ ] Using Node.js v20
- [ ] Browser accessing http://localhost:5173/
- [ ] Browser cache cleared
- [ ] Check browser console errors
- [ ] Check network tab for failed requests

---

## 🐛 Report Issues

If none of the above work, please provide:

1. **Complete browser console error messages**
   - Press F12
   - Screenshot or copy red errors from Console

2. **Frontend terminal output**
   - Complete output after running `npm run dev`

3. **Backend terminal output**
   - Output after running `npm start`

4. **Browser and version**
   - For example: Chrome 120, Safari 17, Firefox 121

---

## 💡 Temporary Test Solution

Create a simple test page:

```bash
cd /Users/xuedong/code/chat-app/client/src
```

Create `Test.tsx`:
```tsx
export default function Test() {
  return <div className="p-4 text-2xl">Hello, Testing!</div>
}
```

Modify `App.tsx`:
```tsx
import Test from './Test'

function App() {
  return <Test />
}

export default App
```

If this displays, the issue is in ChatStore or components.

---

## 🎯 Most Likely Causes

Based on your situation, most likely causes are:

1. **Browser cache** - Try hard refresh (Command + Shift + R)
2. **Node version** - Ensure using Node 20
3. **Vite cache** - Delete `node_modules/.vite`

---

Try these steps now and let me know what errors the browser console shows!
