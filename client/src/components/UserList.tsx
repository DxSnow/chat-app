import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { chatStore } from '../stores/ChatStore';

interface UserListProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserList = observer(({ isOpen, onClose }: UserListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      chatStore.loadUsers();
      setSearchQuery('');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const filteredUsers = chatStore.availableUsers.filter(
    user =>
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectUser = async (userId: string) => {
    setIsStarting(true);
    try {
      await chatStore.startConversation(userId);
      onClose();
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Start New Chat</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto">
          {chatStore.isLoadingUsers ? (
            <div className="p-4 text-center text-gray-500">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {searchQuery ? 'No users found' : 'No other users registered yet'}
            </div>
          ) : (
            filteredUsers.map((user) => (
              <button
                key={user._id}
                onClick={() => handleSelectUser(user._id)}
                disabled={isStarting}
                className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 disabled:opacity-50"
              >
                <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white text-lg font-medium">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">{user.displayName}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Cancel Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
});

export default UserList;
