import { observer } from 'mobx-react-lite';
import { chatStore } from '../stores/ChatStore';
import { authStore } from '../stores/AuthStore';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const ChatWindow = observer(() => {
  const handleLogout = () => {
    chatStore.disconnectWebSocket();
    chatStore.clearMessages();
    authStore.logout();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md p-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-pink-400 to-pink-500 bg-clip-text text-transparent drop-shadow-sm">
          ChaChaChat
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                chatStore.isConnected
                  ? 'bg-green-500'
                  : chatStore.reconnectAttempts > 0
                    ? 'bg-yellow-500 animate-pulse'
                    : 'bg-red-500'
              }`}
            />
            <span className="text-sm text-gray-600">
              {chatStore.isConnected
                ? 'Connected'
                : chatStore.reconnectAttempts > 0
                  ? `Reconnecting (${chatStore.reconnectAttempts}/${chatStore.maxReconnectAttempts})...`
                  : 'Disconnected'}
            </span>
          </div>
          <div className="flex items-center gap-2 border-l pl-4">
            <span className="text-sm text-gray-700 font-medium">
              {authStore.user?.displayName}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-red-500 transition-colors"
              title="Logout"
            >
              Logout
            </button>
          </div>
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
