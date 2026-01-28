const Koa = require('koa');
const Router = require('@koa/router');
const cors = require('@koa/cors');
const bodyParser = require('koa-bodyparser');
const { WebSocketServer } = require('ws');
const http = require('http');
const mongoose = require('mongoose');
const multer = require('@koa/multer');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');
require('dotenv').config();

// Auth imports
const authRouter = require('./routes/auth');
const { authMiddleware, verifyWebSocketToken } = require('./middleware/auth');

// Model imports
const User = require('./models/User');
const Conversation = require('./models/Conversation');

const app = new Koa();
const router = new Router();

// Middleware
app.use(cors());
app.use(bodyParser());

// Create uploads directory if it doesn't exist
const UPLOADS_DIR = path.join(__dirname, 'uploads');
fs.mkdir(UPLOADS_DIR, { recursive: true }).catch(console.error);

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed!'), false);
      return;
    }
    cb(null, true);
  }
});

// MongoDB Message Model
const messageSchema = new mongoose.Schema({
  content: String,
  sender: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now },
  isSelf: Boolean,
  color: String, // Message bubble color (hex format)
  imageUrl: String, // URL path to uploaded image
  hasImage: { type: Boolean, default: false }, // Flag to indicate if message has image
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' }, // null = public chat
  messageType: { type: String, enum: ['public', 'private'], default: 'public' },
});

const Message = mongoose.model('Message', messageSchema);

// MongoDB Image Model - for tracking uploads and cleanup
const imageSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: String,
  size: Number, // File size in bytes
  mimeType: String,
  uploadDate: { type: Date, default: Date.now },
  messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
});

const Image = mongoose.model('Image', imageSchema);

// REST API Routes
router.get('/api/messages', authMiddleware, async (ctx) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      ctx.body = [];
      return;
    }
    // Only return public messages (no conversationId)
    const messages = await Message.find({
      $or: [
        { conversationId: null },
        { conversationId: { $exists: false } },
        { messageType: 'public' }
      ]
    })
      .sort({ timestamp: -1 })
      .limit(100);
    ctx.body = messages.reverse();
  } catch (error) {
    console.error('Error fetching messages:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to fetch messages' };
  }
});

router.post('/api/messages', authMiddleware, async (ctx) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      ctx.body = { success: false, message: 'Database not connected' };
      return;
    }
    const messageData = {
      ...ctx.request.body,
      userId: ctx.state.user.userId,
      sender: ctx.state.user.displayName,
    };
    const message = new Message(messageData);
    await message.save();
    ctx.body = message;
  } catch (error) {
    console.error('Error saving message:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to save message' };
  }
});

// Image upload endpoint
router.post('/api/upload', upload.single('image'), async (ctx) => {
  const startTime = Date.now();
  let uploadedFilePath = null;

  try {
    if (!ctx.file) {
      console.log('[Upload] No file provided in request');
      ctx.status = 400;
      ctx.body = { error: 'No image file provided' };
      return;
    }

    uploadedFilePath = ctx.file.path;
    console.log(`[Upload] Received file: ${ctx.file.originalname}, size: ${(ctx.file.size / 1024).toFixed(2)}KB, type: ${ctx.file.mimetype}`);

    // Check storage BEFORE processing upload
    const storageUsage = await getStorageUsage();
    console.log(`[Upload] Current storage usage: ${storageUsage}%`);

    // If storage is above 50%, run cleanup immediately
    if (storageUsage > 50) {
      console.log('[Upload] ⚠️  Storage above 50%, running emergency cleanup...');
      await cleanupOldImages();

      // Check again after cleanup
      const newStorageUsage = await getStorageUsage();
      if (newStorageUsage > 55) {
        console.log(`[Upload] ❌ Storage still too high after cleanup: ${newStorageUsage}%`);
        ctx.status = 507; // Insufficient Storage
        ctx.body = { error: 'Server storage is full. Please try again later.' };
        await fs.unlink(ctx.file.path);
        return;
      }
    }

    // Compress image using sharp with EXIF orientation handling
    const compressedPath = path.join(UPLOADS_DIR, 'compressed-' + ctx.file.filename);
    console.log(`[Upload] Processing image with Sharp...`);

    await sharp(ctx.file.path)
      .rotate() // Auto-rotate based on EXIF orientation
      .resize(1920, 1920, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85, mozjpeg: true }) // Use mozjpeg for better compression
      .toFile(compressedPath);

    console.log(`[Upload] Image processed successfully`);

    // Delete original, use compressed
    await fs.unlink(ctx.file.path);
    await fs.rename(compressedPath, ctx.file.path);

    // Get final file size
    const stats = await fs.stat(ctx.file.path);
    const compressionRatio = ((1 - stats.size / ctx.file.size) * 100).toFixed(1);
    console.log(`[Upload] Compressed from ${(ctx.file.size / 1024).toFixed(2)}KB to ${(stats.size / 1024).toFixed(2)}KB (saved ${compressionRatio}%)`);

    // Save image metadata to database if MongoDB is connected
    if (mongoose.connection.readyState === 1) {
      const image = new Image({
        filename: ctx.file.filename,
        originalName: ctx.file.originalname,
        size: stats.size,
        mimeType: ctx.file.mimetype,
      });
      await image.save();
      console.log(`[Upload] Metadata saved to database`);
    }

    const processingTime = Date.now() - startTime;
    console.log(`[Upload] ✅ Upload completed in ${processingTime}ms`);

    // Return image URL
    ctx.body = {
      success: true,
      imageUrl: `/uploads/${ctx.file.filename}`,
      filename: ctx.file.filename,
      size: stats.size,
    };
  } catch (error) {
    console.error('[Upload] ❌ Error during upload:', error);
    console.error('[Upload] Error stack:', error.stack);

    // Clean up the uploaded file if it exists
    if (uploadedFilePath) {
      try {
        await fs.unlink(uploadedFilePath);
        console.log(`[Upload] Cleaned up failed upload file`);
      } catch (unlinkError) {
        console.error('[Upload] Failed to clean up file:', unlinkError);
      }
    }

    ctx.status = 500;
    ctx.body = {
      error: 'Failed to upload image: ' + error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
});

// GET /api/users - List all users (for starting conversations)
router.get('/api/users', authMiddleware, async (ctx) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      ctx.body = [];
      return;
    }
    const users = await User.find({ _id: { $ne: ctx.state.user.userId } })
      .select('displayName email')
      .sort({ displayName: 1 });
    ctx.body = users;
  } catch (error) {
    console.error('Error fetching users:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to fetch users' };
  }
});

// GET /api/conversations - Get user's private conversations
router.get('/api/conversations', authMiddleware, async (ctx) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      ctx.body = [];
      return;
    }
    const conversations = await Conversation.find({
      participants: ctx.state.user.userId
    })
      .populate('participants', 'displayName email')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 });
    ctx.body = conversations;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to fetch conversations' };
  }
});

// POST /api/conversations - Create or get existing conversation with another user
router.post('/api/conversations', authMiddleware, async (ctx) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      ctx.status = 503;
      ctx.body = { error: 'Database not connected' };
      return;
    }

    const { participantId } = ctx.request.body;

    if (!participantId) {
      ctx.status = 400;
      ctx.body = { error: 'participantId is required' };
      return;
    }

    // Can't start conversation with yourself
    if (participantId === ctx.state.user.userId) {
      ctx.status = 400;
      ctx.body = { error: 'Cannot start a conversation with yourself' };
      return;
    }

    // Check if the other user exists
    const otherUser = await User.findById(participantId);
    if (!otherUser) {
      ctx.status = 404;
      ctx.body = { error: 'User not found' };
      return;
    }

    const conversation = await Conversation.findOrCreateConversation(
      ctx.state.user.userId,
      participantId
    );

    ctx.body = conversation;
  } catch (error) {
    console.error('Error creating conversation:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to create conversation' };
  }
});

// GET /api/conversations/:id/messages - Get messages for a specific conversation
router.get('/api/conversations/:id/messages', authMiddleware, async (ctx) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      ctx.body = [];
      return;
    }

    const conversationId = ctx.params.id;

    // Verify user is a participant in this conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: ctx.state.user.userId
    });

    if (!conversation) {
      ctx.status = 404;
      ctx.body = { error: 'Conversation not found' };
      return;
    }

    const messages = await Message.find({ conversationId })
      .sort({ timestamp: -1 })
      .limit(100);

    ctx.body = messages.reverse();
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to fetch messages' };
  }
});

// Serve uploaded images
const serve = require('koa-static');
app.use(serve(path.join(__dirname)));

// Mount auth routes
app.use(authRouter.routes()).use(authRouter.allowedMethods());
app.use(router.routes()).use(router.allowedMethods());

// Create HTTP server
const server = http.createServer(app.callback());

// WebSocket Server
const wss = new WebSocketServer({ server });

// Map of userId -> WebSocket for routing private messages
const clients = new Map();
// Also keep a Set for broadcasting public messages (multiple connections per user possible)
const allClients = new Set();

wss.on('connection', (ws, req) => {
  // Extract token from query string
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get('token');

  if (!token) {
    console.log('WebSocket connection rejected: No token provided');
    ws.close(4001, 'Authentication required');
    return;
  }

  const decoded = verifyWebSocketToken(token);
  if (!decoded) {
    console.log('WebSocket connection rejected: Invalid token');
    ws.close(4001, 'Invalid token');
    return;
  }

  // Attach user info to WebSocket
  ws.userId = decoded.userId;
  ws.userEmail = decoded.email;
  ws.displayName = decoded.displayName;

  console.log(`User connected: ${decoded.displayName} (${decoded.email})`);

  // Store in both maps
  clients.set(decoded.userId, ws);
  allClients.add(ws);

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());

      // Use authenticated user info
      message.userId = ws.userId;
      message.sender = ws.displayName;

      const isPrivate = message.conversationId && message.messageType === 'private';
      console.log(`Received ${isPrivate ? 'private' : 'public'} message from ${ws.displayName}`);

      // Save to database if MongoDB is connected
      let savedMessage = null;
      if (mongoose.connection.readyState === 1) {
        const dbMessage = new Message({
          ...message,
          userId: ws.userId,
          sender: ws.displayName,
          timestamp: new Date(message.timestamp),
        });
        savedMessage = await dbMessage.save();

        // Update conversation's lastMessage if it's a private message
        if (isPrivate && message.conversationId) {
          await Conversation.findByIdAndUpdate(message.conversationId, {
            lastMessage: savedMessage._id,
            lastMessageAt: savedMessage.timestamp
          });
        }
      }

      if (isPrivate) {
        // Private message: only send to the other participant
        const conversation = await Conversation.findById(message.conversationId);
        if (conversation) {
          const otherParticipantId = conversation.participants.find(
            p => p.toString() !== ws.userId
          );
          const otherClient = clients.get(otherParticipantId?.toString());
          if (otherClient && otherClient.readyState === 1) {
            otherClient.send(JSON.stringify({
              ...message,
              isSelf: false,
            }));
          }
        }
      } else {
        // Public message: broadcast to all clients except sender
        allClients.forEach((client) => {
          if (client !== ws && client.readyState === 1) {
            client.send(JSON.stringify({
              ...message,
              isSelf: false,
            }));
          }
        });
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    console.log(`User disconnected: ${ws.displayName}`);
    clients.delete(ws.userId);
    allClients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Helper function to get directory size and check storage usage
async function getDirectorySize(dirPath) {
  let totalSize = 0;
  try {
    const files = await fs.readdir(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await fs.stat(filePath);
      if (stats.isFile()) {
        totalSize += stats.size;
      }
    }
  } catch (error) {
    console.error('Error calculating directory size:', error);
  }
  return totalSize;
}

// Helper function to check filesystem usage (Oracle Cloud: 50GB boot volume)
async function getStorageUsage() {
  const { execSync } = require('child_process');
  try {
    // Get disk usage percentage for the root filesystem
    const output = execSync("df -h / | tail -1 | awk '{print $5}'").toString().trim();
    const usagePercent = parseInt(output.replace('%', ''));
    return usagePercent;
  } catch (error) {
    console.error('Error checking storage usage:', error);
    return 0;
  }
}

// Cleanup old images (delete after 3 days OR if storage > 50%)
async function cleanupOldImages() {
  try {
    console.log('Running image cleanup job...');

    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const uploadsSize = await getDirectorySize(UPLOADS_DIR);
    const storageUsage = await getStorageUsage();

    console.log(`Uploads directory size: ${(uploadsSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Root filesystem usage: ${storageUsage}%`);

    // Delete images older than 3 days
    if (mongoose.connection.readyState === 1) {
      const oldImages = await Image.find({
        uploadDate: { $lt: threeDaysAgo }
      });

      for (const img of oldImages) {
        const filePath = path.join(UPLOADS_DIR, img.filename);
        try {
          await fs.unlink(filePath);
          await Image.deleteOne({ _id: img._id });
          console.log(`Deleted old image: ${img.filename}`);
        } catch (error) {
          console.error(`Error deleting ${img.filename}:`, error);
        }
      }
    }

    // If storage > 50%, delete oldest images until we're under 45%
    if (storageUsage > 50) {
      console.log('⚠️  Storage usage above 50%, cleaning up oldest images...');

      if (mongoose.connection.readyState === 1) {
        // Get all images sorted by upload date (oldest first)
        const allImages = await Image.find().sort({ uploadDate: 1 });

        for (const img of allImages) {
          // Check current storage
          const currentUsage = await getStorageUsage();
          if (currentUsage <= 45) {
            console.log('✅ Storage usage now at safe levels');
            break;
          }

          const filePath = path.join(UPLOADS_DIR, img.filename);
          try {
            await fs.unlink(filePath);
            await Image.deleteOne({ _id: img._id });
            console.log(`Deleted image to free space: ${img.filename}`);
          } catch (error) {
            console.error(`Error deleting ${img.filename}:`, error);
          }
        }
      }
    }

    console.log('Cleanup job completed');
  } catch (error) {
    console.error('Error in cleanup job:', error);
  }
}

// Schedule cleanup job to run every 6 hours
cron.schedule('0 */6 * * *', () => {
  console.log('Scheduled cleanup job starting...');
  cleanupOldImages();
});

// Also run a storage check every hour (doesn't delete, just warns)
cron.schedule('0 * * * *', async () => {
  const storageUsage = await getStorageUsage();
  const uploadsSize = await getDirectorySize(UPLOADS_DIR);
  console.log(`[Hourly Check] Storage: ${storageUsage}%, Uploads: ${(uploadsSize / 1024 / 1024).toFixed(2)} MB`);

  if (storageUsage > 60) {
    console.log('⚠️  WARNING: Storage usage is high! Consider manual cleanup.');
  }
});

// Run cleanup on server start
setTimeout(() => cleanupOldImages(), 5000);

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
