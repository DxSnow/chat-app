const Koa = require('koa');
const Router = require('@koa/router');
const cors = require('@koa/cors');
const bodyParser = require('koa-bodyparser');
const { WebSocketServer } = require('ws');
const http = require('http');
const mongoose = require('mongoose');
require('dotenv').config();

const app = new Koa();
const router = new Router();

// Middleware
app.use(cors());
app.use(bodyParser());

// MongoDB Message Model
const messageSchema = new mongoose.Schema({
  content: String,
  sender: String,
  timestamp: { type: Date, default: Date.now },
  isSelf: Boolean,
  color: String, // Message bubble color (hex format)
});

const Message = mongoose.model('Message', messageSchema);

// REST API Routes
router.get('/api/messages', async (ctx) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      ctx.body = [];
      return;
    }
    const messages = await Message.find()
      .sort({ timestamp: -1 })
      .limit(100);
    ctx.body = messages.reverse();
  } catch (error) {
    console.error('Error fetching messages:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to fetch messages' };
  }
});

router.post('/api/messages', async (ctx) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      ctx.body = { success: false, message: 'Database not connected' };
      return;
    }
    const message = new Message(ctx.request.body);
    await message.save();
    ctx.body = message;
  } catch (error) {
    console.error('Error saving message:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to save message' };
  }
});

app.use(router.routes()).use(router.allowedMethods());

// Create HTTP server
const server = http.createServer(app.callback());

// WebSocket Server
const wss = new WebSocketServer({ server });

const clients = new Set();

wss.on('connection', (ws) => {
  console.log('New client connected');
  clients.add(ws);

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('Received message:', message);

      // Save to database if MongoDB is connected
      if (mongoose.connection.readyState === 1) {
        const dbMessage = new Message({
          ...message,
          timestamp: new Date(message.timestamp),
        });
        await dbMessage.save();
      }

      // Broadcast to all clients except sender
      clients.forEach((client) => {
        if (client !== ws && client.readyState === 1) {
          client.send(JSON.stringify({
            ...message,
            isSelf: false,
          }));
        }
      });
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// MongoDB Connection
const connectDB = async () => {
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('MongoDB connected');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      console.log('Running without database persistence');
    }
  } else {
    console.log('No MONGODB_URI found. Running in memory-only mode.');
  }
};

// Start server
const PORT = process.env.PORT || 3001;

server.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
  await connectDB();
});
