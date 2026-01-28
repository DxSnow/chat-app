import { observer } from 'mobx-react-lite';
import { chatStore } from '../stores/ChatStore';
import type { Conversation } from '../stores/ChatStore';

interface ConversationListProps {
  onNewChat: () => void;
}

const ConversationList = observer(({ onNewChat }: ConversationListProps) => {
  const isPublicActive = !chatStore.activeConversation;

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(
      p => p._id !== chatStore.currentUser?.id
    );
  };

  const formatLastMessage = (conversation: Conversation) => {
    if (!conversation.lastMessage) {
      return 'No messages yet';
    }
    const content = conversation.lastMessage.content;
    if (conversation.lastMessage.hasImage) {
      return '📷 Image';
    }
    return content.length > 30 ? content.substring(0, 30) + '...' : content;
  };

  const formatTime = (date: Date | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold text-gray-800">Chats</h2>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {/* Public Chat Option */}
        <button
          onClick={() => chatStore.selectConversation(null)}
          className={`w-full p-4 flex items-center gap-3 hover:bg-gray-100 transition-colors border-b border-gray-200 ${
            isPublicActive ? 'bg-blue-50' : ''
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl">
            🌐
          </div>
          <div className="flex-1 text-left">
            <div className="font-medium text-gray-900">Public Chat</div>
            <div className="text-sm text-gray-500">Everyone can see these messages</div>
          </div>
        </button>

        {/* Divider */}
        <div className="px-4 py-2 bg-gray-100">
          <span className="text-xs font-medium text-gray-500 uppercase">Direct Messages</span>
        </div>

        {/* Private Conversations */}
        {chatStore.isLoadingConversations ? (
          <div className="p-4 text-center text-gray-500">Loading...</div>
        ) : chatStore.conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No private conversations yet
          </div>
        ) : (
          chatStore.conversations.map((conversation) => {
            const otherUser = getOtherParticipant(conversation);
            const isActive = chatStore.activeConversation?._id === conversation._id;

            return (
              <button
                key={conversation._id}
                onClick={() => chatStore.selectConversation(conversation)}
                className={`w-full p-4 flex items-center gap-3 hover:bg-gray-100 transition-colors border-b border-gray-200 ${
                  isActive ? 'bg-blue-50' : ''
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white text-lg font-medium">
                  {otherUser?.displayName.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 truncate">
                      {otherUser?.displayName || 'Unknown'}
                    </span>
                    <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                      {formatTime(conversation.lastMessageAt)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {formatLastMessage(conversation)}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* New Chat Button */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <button
          onClick={onNewChat}
          className="w-full py-3 px-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
        >
          <span className="text-lg">+</span>
          New Chat
        </button>
      </div>
    </div>
  );
});

export default ConversationList;
