# Image Upload Feature

This document describes the image upload functionality added to the chat application.

## Overview

Users can now upload and share images in the chat. Images are stored on the Oracle Cloud server filesystem and automatically cleaned up based on age and storage usage.

## Features

### Image Upload
- Click the camera icon (📷) in the message input area
- Select an image from your device
- Maximum file size: **5MB**
- Supported formats: All image formats (JPEG, PNG, GIF, WebP, etc.)
- Automatic compression to optimize storage

### Image Display
- Images appear inline in chat messages
- Click on any image to open it in full size in a new tab
- Images load lazily for better performance
- Responsive design: images adapt to screen size

### Automatic Cleanup

Images are automatically deleted under two conditions:

1. **Age-based cleanup**: Images older than **3 days** are deleted
2. **Storage-based cleanup**: If root filesystem usage exceeds **50%**, oldest images are deleted until usage drops to **45%**

The cleanup job runs:
- **Every 6 hours** via scheduled cron job
- **On every image upload** - checks storage before accepting upload
- **Hourly monitoring** - logs storage status and warns if > 60%
- **On server startup** (after 5 seconds)

**Upload Protection**: If storage is above 50%, cleanup runs immediately. If storage remains above 55% after cleanup, the upload is rejected with a "storage full" error to prevent server crashes.

## Technical Details

### Storage Calculation

Your Oracle Cloud setup:
- **Boot Volume**: 50GB
- **Storage threshold**: 50% = 25GB
- **Safe level**: 45% = 22.5GB
- **Available for cleanup**: ~2.5GB buffer

### Backend Implementation

#### New Dependencies
- `@koa/multer` - File upload handling
- `multer` - Multipart form data parser
- `sharp` - Image compression and optimization
- `node-cron` - Scheduled cleanup jobs
- `koa-static` - Serving uploaded files

#### API Endpoints

**Upload Image:**
```
POST /api/upload
Content-Type: multipart/form-data

Body: FormData with 'image' field

Response:
{
  "success": true,
  "imageUrl": "/uploads/1234567890-123456789.jpg",
  "filename": "1234567890-123456789.jpg",
  "size": 245678
}
```

**Serve Images:**
```
GET /uploads/:filename
```

#### Database Schema

**Image Collection:**
```typescript
{
  filename: String,        // Unique filename on filesystem
  originalName: String,    // Original filename from user
  size: Number,           // File size in bytes
  mimeType: String,       // MIME type (e.g., 'image/jpeg')
  uploadDate: Date,       // Upload timestamp
  messageId: ObjectId     // Reference to message (optional)
}
```

**Message Collection (updated):**
```typescript
{
  content: String,
  sender: String,
  timestamp: Date,
  isSelf: Boolean,
  color: String,
  imageUrl: String,       // NEW: URL path to image
  hasImage: Boolean       // NEW: Flag for image presence
}
```

### Frontend Implementation

#### ChatStore Updates

**New Method:**
```typescript
async sendImage(file: File): Promise<any>
```

**Updated Method:**
```typescript
sendMessage(content: string, imageUrl?: string)
```

#### Component Updates

**MessageInput:**
- Added file input with camera icon button
- Upload progress indicator
- File size and type validation
- Calls `chatStore.sendImage()` on file selection

**MessageBubble:**
- Displays images when `hasImage` is true
- Click to open full-size image in new tab
- Lazy loading for performance
- Responsive sizing

### Compression

Images are automatically compressed using Sharp:
- Maximum dimensions: 1920x1920px (maintains aspect ratio)
- Format: Converted to JPEG
- Quality: 85%
- Original file is replaced with compressed version

This typically reduces file sizes by 50-70% without visible quality loss.

## Usage

### For Users

1. **Upload an Image:**
   - Click the camera icon (📷)
   - Select an image (max 5MB)
   - Wait for upload to complete
   - Image appears in your message

2. **View Images:**
   - Scroll through chat to see images
   - Click any image to view full size

### For Developers

**Local Development:**
```bash
# Start backend
cd server
npm install  # Installs new dependencies
npm start

# Start frontend
cd client
npm run dev
```

**Production Deployment:**

1. Deploy backend to Oracle Cloud:
```bash
ssh -i ~/.ssh/oracle-chat-server.key ubuntu@your-domain.duckdns.org
cd /var/www/chat-app
git pull
npm install
pm2 restart chat-server
```

2. Update Nginx config to serve uploads:
```nginx
# Already configured via koa-static
# No changes needed!
```

3. Deploy frontend to Vercel:
```bash
git add .
git commit -m "Add image upload feature"
git push origin main
# Vercel auto-deploys
```

## Monitoring

### Check Storage Usage

**On Oracle Cloud server:**
```bash
# Check root filesystem usage
df -h /

# Check uploads directory size
du -sh /var/www/chat-app/uploads

# View cleanup logs
pm2 logs chat-server | grep cleanup
```

### Manual Cleanup

If needed, you can manually trigger cleanup:

```bash
# SSH into server
ssh -i ~/.ssh/oracle-chat-server.key ubuntu@your-domain.duckdns.org

# Run cleanup via Node
cd /var/www/chat-app
node -e "require('./index.js')"
# Wait 5 seconds for cleanup to run

# Or manually delete old files
find uploads/ -type f -mtime +3 -delete
```

## Configuration

### Adjust Settings

Edit `server/index.js` to modify:

**File size limit:**
```javascript
const upload = multer({
  // ...
  limits: {
    fileSize: 5 * 1024 * 1024, // Change this (in bytes)
  },
  // ...
});
```

**Cleanup age:**
```javascript
const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
// Change 3 to desired days
```

**Storage thresholds:**
```javascript
if (storageUsage > 50) { // Trigger cleanup at 50%
  // ...
  if (currentUsage <= 45) { // Stop cleanup at 45%
    break;
  }
}
```

**Cleanup schedule:**
```javascript
cron.schedule('0 2 * * *', () => { // Daily at 2 AM
  cleanupOldImages();
});
```

## Security Considerations

1. **File Type Validation**: Only image MIME types are accepted
2. **Size Limits**: 5MB max to prevent abuse
3. **Compression**: Reduces storage requirements
4. **Automatic Cleanup**: Prevents unlimited storage growth
5. **No executable files**: Sharp processing removes any embedded scripts

## Performance

### Optimization Features

- **Lazy Loading**: Images load only when scrolled into view
- **Compression**: ~50-70% size reduction
- **CDN Ready**: Serve `/uploads` via CDN for better performance (optional)
- **Responsive Images**: Adapt to screen size automatically

### Expected Performance

- **Upload time**: 1-3 seconds for typical photos
- **Storage per image**: 100-500KB after compression
- **Database overhead**: ~200 bytes per image record
- **Bandwidth**: Images served directly from server (or CDN)

## Future Enhancements

Potential improvements:

- [ ] Image thumbnails for faster loading
- [ ] Multiple images per message
- [ ] Drag and drop upload
- [ ] Copy/paste image support
- [ ] Image gallery view
- [ ] User-specific upload quotas
- [ ] CDN integration (Cloudflare, etc.)
- [ ] Image editing (crop, rotate, filters)
- [ ] Video upload support
- [ ] GIF support with preview

## Troubleshooting

### Images Not Uploading

**Check:**
1. File size < 5MB
2. File is an image type
3. Server is running
4. Network connection is stable
5. Check browser console for errors

**Solution:**
```bash
# Check server logs
pm2 logs chat-server

# Verify uploads directory exists
ls -la /var/www/chat-app/uploads

# Check permissions
chmod 755 /var/www/chat-app/uploads
```

### Images Not Displaying

**Check:**
1. Image URL is correct
2. Server serving static files
3. Browser can access `/uploads` path
4. CORS settings allow image loading

**Solution:**
```bash
# Test direct access
curl http://localhost:3001/uploads/filename.jpg

# Check koa-static middleware is loaded
pm2 logs chat-server | grep "static"
```

### Storage Cleanup Not Working

**Check:**
1. MongoDB is connected (needed for tracking)
2. Cron job is running
3. Server has necessary permissions
4. Check logs for errors

**Solution:**
```bash
# View cleanup logs
pm2 logs chat-server | grep -i cleanup

# Manually trigger
pm2 restart chat-server
# Wait 5 seconds, check logs
```

## License

Same as main project (MIT)

---

**Questions?** Check the main [README.md](./README.md) or create an issue on GitHub.
