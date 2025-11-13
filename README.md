# Chat App - Real-time Chat Application

A real-time chat application built with modern technology stack, supporting PWA features and working perfectly on both mobile and desktop devices.

[中文文档](./README.zh.md)

## Tech Stack

### Frontend
- **React** - UI Framework
- **TypeScript** - Type Safety
- **MobX** - State Management
- **Tailwind CSS** - Styling Framework
- **Vite** - Build Tool
- **PWA** - Progressive Web App

### Backend
- **Koa.js** - Node.js Web Framework
- **WebSocket (ws)** - Real-time Communication
- **MongoDB** - Database (Optional)
- **Mongoose** - MongoDB ODM

## Features

- ✅ Real-time message sending and receiving
- ✅ WebSocket real-time communication
- ✅ Message history
- ✅ Responsive design (mobile and desktop friendly)
- ✅ PWA support (installable to desktop)
- ✅ Offline message caching
- ✅ MongoDB persistent storage (optional)
- ✅ WeChat-like chat interface
- ✅ Custom nickname support
- ✅ Color picker for personalized messages

## Project Structure

```
chat-app/
├── client/                 # Frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   └── MessageInput.tsx
│   │   ├── stores/        # MobX state management
│   │   │   └── ChatStore.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   └── package.json
└── server/                # Backend server
    ├── index.js           # Koa server + WebSocket
    ├── .env.example       # Environment variables example
    └── package.json
```

## Quick Start

### Requirements

- Node.js >= 18.x (Latest LTS recommended)
- npm >= 8.x

### Installation Steps

1. **Clone the project**
```bash
git clone <your-repo-url>
cd chat-app
```

2. **Install frontend dependencies**
```bash
cd client
npm install
```

3. **Install backend dependencies**
```bash
cd ../server
npm install
```

4. **Configure environment variables (optional)**
```bash
cd server
cp .env.example .env
# Edit .env file and add MongoDB connection string
```

### Running the Application

1. **Start backend server**
```bash
cd server
npm start
```
Server will start at `http://localhost:3001`

2. **Start frontend application (new terminal window)**
```bash
cd client
npm run dev
```
Frontend will start at `http://localhost:5173`

3. **Access the application**

Open your browser and visit: `http://localhost:5173`

## MongoDB Configuration

### Using MongoDB Atlas (Recommended)

1. Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get connection string
4. Set in `server/.env`:
```
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/chat-app?retryWrites=true&w=majority
```

### Running Without Database

If MongoDB is not configured, the application will run in memory mode (messages will be lost after restart).

## PWA Features

### Installing on Mobile

1. Open the app in your mobile browser
2. Tap "Add to Home Screen" in the browser menu
3. The app icon will appear on your desktop

### Features

- Offline access
- Message caching
- Native app-like experience
- Splash screen
- Standalone window

## Development

### Frontend Development
```bash
cd client
npm run dev    # Development mode
npm run build  # Production build
npm run preview # Preview production build
```

### Backend Development
```bash
cd server
npm run dev    # Start server
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## API Endpoints

### REST API

- `GET /api/messages` - Get message history
- `POST /api/messages` - Save new message

### WebSocket

Connection address: `ws://localhost:3001`

Message format:
```json
{
  "id": "msg-1234567890",
  "content": "Hello",
  "sender": "User",
  "timestamp": "2025-10-31T12:00:00.000Z",
  "isSelf": true
}
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Android)

## Troubleshooting

### WebSocket Connection Failed

1. Ensure backend server is running
2. Check firewall settings
3. Verify URL configuration is correct

### MongoDB Connection Error

1. Check connection string format
2. Verify network IP whitelist
3. Validate username and password

### PWA Cannot Install

1. Ensure using HTTPS (production environment)
2. Check manifest.json configuration
3. Verify icon files exist

## Contributing

Issues and Pull Requests are welcome!

## License

MIT

## Contact

For questions, please submit an Issue or contact the developer.
