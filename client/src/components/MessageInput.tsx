import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { chatStore } from '../stores/ChatStore';

const MessageInput = observer(() => {
  const [message, setMessage] = useState('');

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

  return (
    <div className="p-4 flex gap-2">
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
