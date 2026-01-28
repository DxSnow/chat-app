import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { authStore } from '../../stores/AuthStore';

const RegisterForm = observer(() => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secretWord, setSecretWord] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!email.trim()) {
      setLocalError('Please enter your email');
      return;
    }

    if (!username.trim()) {
      setLocalError('Please enter a username');
      return;
    }

    if (username.trim().length < 2) {
      setLocalError('Username must be at least 2 characters');
      return;
    }

    if (username.trim().length > 20) {
      setLocalError('Username must be 20 characters or less');
      return;
    }

    if (!password) {
      setLocalError('Please enter a password');
      return;
    }

    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (!secretWord.trim()) {
      setLocalError('Please enter a secret word');
      return;
    }

    if (secretWord.trim().length < 2) {
      setLocalError('Secret word must be at least 2 characters');
      return;
    }

    try {
      await authStore.register(
        email.trim(),
        password,
        username.trim(),
        secretWord.trim()
      );
    } catch {
      // Error is handled by the store
    }
  };

  const displayError = localError || authStore.error;

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-medium mb-2">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setLocalError('');
            authStore.clearError();
          }}
          placeholder="you@example.com"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
          autoFocus
          autoComplete="email"
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-medium mb-2">
          Username
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setLocalError('');
            authStore.clearError();
          }}
          placeholder="Your display name"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
          autoComplete="username"
          maxLength={20}
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-medium mb-2">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setLocalError('');
            authStore.clearError();
          }}
          placeholder="At least 8 characters"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
          autoComplete="new-password"
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-medium mb-2">
          Confirm Password
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setLocalError('');
            authStore.clearError();
          }}
          placeholder="Confirm your password"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
          autoComplete="new-password"
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-medium mb-2">
          Secret Word
        </label>
        <input
          type="text"
          value={secretWord}
          onChange={(e) => {
            setSecretWord(e.target.value);
            setLocalError('');
            authStore.clearError();
          }}
          placeholder="A word only you know"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
          autoComplete="off"
        />
        <p className="text-gray-500 text-xs mt-1">Pick a secret word to help reset your password if you forget it. Don't share it with anyone!</p>
      </div>

      {displayError && (
        <p className="text-red-500 text-sm mb-4">{displayError}</p>
      )}

      <button
        type="submit"
        disabled={authStore.isLoading || !email.trim() || !username.trim() || !password || !confirmPassword || !secretWord.trim()}
        className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {authStore.isLoading ? 'Creating account...' : 'Create Account'}
      </button>

      <p className="text-gray-500 text-xs mt-4 text-center">
        By creating an account, you agree to our terms of service.
      </p>
    </form>
  );
});

export default RegisterForm;
