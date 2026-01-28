import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { chatStore } from '../stores/ChatStore';
import { authStore } from '../stores/AuthStore';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ProfileModal from './ProfileModal';

const ChatWindow = observer(() => {
  const [showProfile, setShowProfile] = useState(false);
  const [username, setUsername] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = () => {
    chatStore.disconnectWebSocket();
    chatStore.clearMessages();
    authStore.logout();
  };

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError('Please enter a username');
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const result = await chatStore.findConversationByUsername(trimmedUsername);
      if (result.error) {
        setError(result.error);
      }
      // If successful, activeConversation will be set and UI will update
    } finally {
      setIsSearching(false);
    }
  };

  const handleBackToSearch = () => {
    chatStore.selectConversation(null);
    setUsername('');
    setError(null);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-md p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {chatStore.activeConversation ? (
              <>
                <button
                  onClick={handleBackToSearch}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Back to search"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-medium">
                  {chatStore.activeConversationPartner?.displayName.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-800">
                    {chatStore.activeChatTitle}
                  </h1>
                </div>
              </>
            ) : (
              <h1 className="text-lg font-semibold text-gray-800">Chat</h1>
            )}
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
                    ? 'Reconnecting...'
                    : 'Disconnected'}
              </span>
            </div>
            <div className="flex items-center gap-2 border-l pl-4">
              <button
                onClick={() => setShowProfile(true)}
                className="text-sm text-gray-700 font-medium hover:text-blue-500 transition-colors"
                title="Edit profile"
              >
                {authStore.user?.displayName}
              </button>
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

        {/* Main Content */}
        {chatStore.activeConversation ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-hidden">
              <MessageList />
            </div>

            {/* Input */}
            <div className="bg-white border-t border-gray-200">
              <MessageInput />
            </div>
          </>
        ) : (
          /* Username Search Screen */
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="w-full max-w-md">
              <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
                Who do you want to talk to today?
              </h2>
              <p className="text-gray-500 text-center mb-8">
                Type in their username to start chatting
              </p>

              <form onSubmit={handleStartChat}>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError(null);
                  }}
                  placeholder="Enter username..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 text-lg"
                  autoFocus
                  disabled={isSearching}
                />

                {error && (
                  <p className="text-red-500 text-sm mt-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isSearching || !username.trim()}
                  className="w-full mt-4 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSearching ? 'Searching...' : 'Start Chat'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
    </div>
  );
});

export default ChatWindow;
