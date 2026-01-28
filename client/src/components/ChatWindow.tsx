import { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { chatStore } from '../stores/ChatStore';
import { authStore } from '../stores/AuthStore';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ConversationList from './ConversationList';
import UserList from './UserList';

const ChatWindow = observer(() => {
  const [showUserList, setShowUserList] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Load conversations when component mounts
  useEffect(() => {
    chatStore.loadConversations();
  }, []);

  const handleLogout = () => {
    chatStore.disconnectWebSocket();
    chatStore.clearMessages();
    authStore.logout();
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - Conversation List */}
      <div
        className={`${
          isSidebarOpen ? 'w-80' : 'w-0'
        } transition-all duration-300 overflow-hidden border-r border-gray-200 flex-shrink-0`}
      >
        <ConversationList onNewChat={() => setShowUserList(true)} />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-white shadow-md p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Sidebar Toggle */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Chat Title */}
            <div className="flex items-center gap-2">
              {chatStore.activeConversation ? (
                <>
                  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-medium">
                    {chatStore.activeConversationPartner?.displayName.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-gray-800">
                      {chatStore.activeChatTitle}
                    </h1>
                    <span className="text-xs text-gray-500">Private conversation</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-lg">
                    🌐
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-gray-800">Public Chat</h1>
                    <span className="text-xs text-gray-500">Everyone can see these messages</span>
                  </div>
                </>
              )}
            </div>
          </div>

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
                    ? `Reconnecting...`
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

      {/* User List Modal */}
      <UserList isOpen={showUserList} onClose={() => setShowUserList(false)} />
    </div>
  );
});

export default ChatWindow;
