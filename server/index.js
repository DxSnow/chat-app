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
    fileSize: 5 * 1024 * 1024, // 5MB limit
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
  timestamp: { type: Date, default: Date.now },
  isSelf: Boolean,
  color: String, // Message bubble color (hex format)
  imageUrl: String, // URL path to uploaded image
  hasImage: { type: Boolean, default: false }, // Flag to indicate if message has image
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

// Image upload endpoint
router.post('/api/upload', upload.single('image'), async (ctx) => {
  try {
    if (!ctx.file) {
      ctx.status = 400;
      ctx.body = { error: 'No image file provided' };
      return;
    }

    // Check storage BEFORE processing upload
    const storageUsage = await getStorageUsage();
    console.log(`Current storage usage: ${storageUsage}%`);

    // If storage is above 50%, run cleanup immediately
    if (storageUsage > 50) {
      console.log('⚠️  Storage above 50%, running emergency cleanup...');
      await cleanupOldImages();

      // Check again after cleanup
      const newStorageUsage = await getStorageUsage();
      if (newStorageUsage > 55) {
        // Still too high, reject upload
        ctx.status = 507; // Insufficient Storage
        ctx.body = { error: 'Server storage is full. Please try again later.' };
        await fs.unlink(ctx.file.path); // Delete the uploaded file
        return;
      }
    }

    // Compress image using sharp
    const compressedPath = path.join(UPLOADS_DIR, 'compressed-' + ctx.file.filename);
    await sharp(ctx.file.path)
      .resize(1920, 1920, { // Max 1920px on longest side
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85 }) // Convert to JPEG with 85% quality
      .toFile(compressedPath);

    // Delete original, use compressed
    await fs.unlink(ctx.file.path);
    await fs.rename(compressedPath, ctx.file.path);

    // Get final file size
    const stats = await fs.stat(ctx.file.path);

    // Save image metadata to database if MongoDB is connected
    if (mongoose.connection.readyState === 1) {
      const image = new Image({
        filename: ctx.file.filename,
        originalName: ctx.file.originalname,
        size: stats.size,
        mimeType: ctx.file.mimetype,
      });
      await image.save();
    }

    // Return image URL
    ctx.body = {
      success: true,
      imageUrl: `/uploads/${ctx.file.filename}`,
      filename: ctx.file.filename,
      size: stats.size,
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to upload image: ' + error.message };
  }
});

// Serve uploaded images
const serve = require('koa-static');
app.use(serve(path.join(__dirname)));

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
