import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { authStore } from '../../stores/AuthStore';

interface OTPRequestFormProps {
  onBack: () => void;
}

const OTPRequestForm = observer(({ onBack }: OTPRequestFormProps) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      return;
    }

    try {
      await authStore.requestOTP(email.trim(), username.trim() || undefined);
    } catch {
      // Error is handled by the store
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <p className="text-gray-600 text-sm mb-4">
        Enter your email and we'll send you a one-time code to sign in.
        No password needed!
      </p>

      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-medium mb-2">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
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
          Username <span className="text-gray-400 font-normal">(for new accounts)</span>
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            authStore.clearError();
          }}
          placeholder="Your display name"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
          autoComplete="username"
          maxLength={20}
        />
      </div>

      {authStore.error && (
        <p className="text-red-500 text-sm mb-4">{authStore.error}</p>
      )}

      <button
        type="submit"
        disabled={authStore.isLoading || !email.trim()}
        className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {authStore.isLoading ? 'Sending code...' : 'Send Code'}
      </button>

      <button
        type="button"
        onClick={onBack}
        className="w-full mt-3 text-gray-600 py-2 hover:text-gray-800 transition-colors"
      >
        Back to login
      </button>
    </form>
  );
});

export default OTPRequestForm;
