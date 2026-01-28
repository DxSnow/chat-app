import { observer } from 'mobx-react-lite';
import { useState, useRef } from 'react';
import { chatStore } from '../stores/ChatStore';

const MessageInput = observer(() => {
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (message.trim() && chatStore.isConnected) {
      chatStore.sendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (15MB limit)
    if (file.size > 15 * 1024 * 1024) {
      alert('Image size must be less than 15MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setUploading(true);
    try {
      await chatStore.sendImage(file);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Failed to upload image:', error);

      // Provide specific error messages
      let errorMessage = 'Failed to upload image.\n\n';

      if (error.message.includes('Server storage is full')) {
        errorMessage += '❌ Server storage is full. Please try again later or contact the admin.';
      } else if (error.message.includes('Not connected')) {
        errorMessage += '❌ Not connected to server.\n\n🔄 To refresh:\n• Mobile: Pull down from top of page\n• Desktop: Press Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)';
      } else if (error.message.includes('Network')) {
        errorMessage += '❌ Network error. Please check your internet connection and try again.';
      } else if (error.message.includes('timeout')) {
        errorMessage += '❌ Upload timed out. Your connection might be slow. Try a smaller image or better WiFi.';
      } else {
        errorMessage += `❌ ${error.message || 'Unknown error'}\n\n🔄 Try refreshing:\n• Mobile: Pull down from top of page\n• Desktop: Press Ctrl+Shift+R`;
      }

      alert(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 flex gap-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageSelect}
        accept="image/*"
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={!chatStore.isConnected || uploading}
        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
        title="Upload image"
      >
        {uploading ? '📤' : '📷'}
      </button>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={
          chatStore.isConnected
            ? 'Type a message...'
            : 'Connecting to server...'
        }
        disabled={!chatStore.isConnected}
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
      <button
        onClick={handleSend}
        disabled={!message.trim() || !chatStore.isConnected}
        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        Send
      </button>
    </div>
  );
});

export default MessageInput;
