import { useState } from 'react';

interface NicknameModalProps {
  onSubmit: (nickname: string) => void;
}

const NicknameModal = ({ onSubmit }: NicknameModalProps) => {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedNickname = nickname.trim();

    if (!trimmedNickname) {
      setError('Please enter a nickname');
      return;
    }

    if (trimmedNickname.length < 2) {
      setError('Nickname must be at least 2 characters');
      return;
    }

    if (trimmedNickname.length > 20) {
      setError('Nickname must be less than 20 characters');
      return;
    }

    onSubmit(trimmedNickname);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Welcome to Chat!</h2>
        <p className="text-gray-600 mb-6">Please enter a nickname to continue</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setError('');
              }}
              placeholder="e.g. SnowD or Guest123"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              autoFocus
              maxLength={20}
            />
            {error && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            Join Chat
          </button>
        </form>
      </div>
    </div>
  );
};

export default NicknameModal;
