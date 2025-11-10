import { observer } from 'mobx-react-lite';
import { chatStore } from '../stores/ChatStore';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const ChatWindow = observer(() => {
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md p-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">Chat</h1>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              chatStore.isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-sm text-gray-600">
            {chatStore.isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageList />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200">
        <MessageInput />
      </div>
    </div>
  );
});

export default ChatWindow;
