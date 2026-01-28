# Chat App - Private Messaging Application

A private messaging application built with modern technology stack, supporting PWA features and working perfectly on both mobile and desktop devices.

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
- **MongoDB** - Database (Required)
- **Mongoose** - MongoDB ODM
- **bcrypt** - Password Hashing
- **JWT** - Authentication

## Features

- Private 1-on-1 messaging (no public chat)
- User authentication with email/password
- Password recovery via secret word
- Real-time message delivery via WebSocket
- Message history persistence
- Responsive design (mobile and desktop friendly)
- PWA support (installable to desktop)
- Image sharing with automatic compression
- Registration limit (configurable, default 20 users)
- Color picker for personalized messages

## How It Works

1. **Register** with email, password, username, and a secret word
2. **Login** with email and password
3. **Start a chat** by entering another user's username
4. **Send messages** - they're delivered in real-time
5. **Previous conversations** load automatically when you enter the same username

## Project Structure

```
chat-app/
├── client/                 # Frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── ChatWindow.tsx      # Main chat interface
│   │   │   ├── MessageList.tsx     # Message display
│   │   │   ├── MessageBubble.tsx   # Individual message
│   │   │   ├── MessageInput.tsx    # Message input
│   │   │   ├── ProfileModal.tsx    # Profile editor
│   │   │   └── auth/               # Authentication components
│   │   ├── stores/        # MobX state management
│   │   │   ├── ChatStore.ts
│   │   │   └── AuthStore.ts
│   │   ├── services/      # API services
│   │   │   └── authService.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
└── server/                # Backend server
    ├── index.js           # Koa server + WebSocket
    ├── routes/
    │   └── auth.js        # Authentication routes
    ├── models/
    │   ├── User.js        # User model
    │   └── Conversation.js # Conversation model
    ├── middleware/
    │   └── auth.js        # JWT middleware
    ├── .env.example       # Environment variables example
    └── package.json
```

## Quick Start

### Requirements

- Node.js >= 18.x (Latest LTS recommended)
- npm >= 8.x
- MongoDB (Atlas or local)

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

4. **Configure environment variables**
```bash
cd server
cp .env.example .env
# Edit .env file and add:
# - MONGODB_URI (required)
# - JWT_SECRET (required)
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

## Configuration

### Registration Limit

By default, only 20 users can register. To change this limit, edit `server/routes/auth.js`:

```javascript
const MAX_USERS = 20; // Change this number
```

### MongoDB Configuration

#### Using MongoDB Atlas (Recommended)

1. Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get connection string
4. Set in `server/.env`:
```
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/chat-app?retryWrites=true&w=majority
JWT_SECRET=your-secret-key-here
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update display name
- `POST /api/auth/forgot-password/verify-email` - Verify email for password reset
- `POST /api/auth/forgot-password/reset` - Reset password with secret word

### Conversations

- `POST /api/conversations/by-username` - Find/create conversation by username
- `GET /api/conversations/:id/messages` - Get messages for a conversation

### WebSocket

Connection: `ws://localhost:3001?token=<jwt-token>`

Message format:
```json
{
  "id": "msg-1234567890",
  "content": "Hello",
  "sender": "Username",
  "timestamp": "2025-01-27T12:00:00.000Z",
  "conversationId": "conversation-id",
  "messageType": "private"
}
```

## PWA Features

### Installing on Mobile

1. Open the app in your mobile browser
2. Tap "Add to Home Screen" in the browser menu
3. The app icon will appear on your desktop

### Features

- Offline access
- Native app-like experience
- Splash screen
- Standalone window

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Android)

## Troubleshooting

### "Failed to fetch" on Login

1. Ensure backend server is running
2. Check that MongoDB is connected
3. Verify CORS settings

### WebSocket Connection Failed

1. Ensure backend server is running
2. Check that JWT token is valid
3. Verify WebSocket URL configuration

### "User already exists" but can't login

Old OTP-only users are automatically cleaned up on server restart. Restart the server and try registering again.

## License

MIT
