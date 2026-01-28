import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { authStore } from '../../stores/AuthStore';

interface LoginFormProps {
  onForgotPassword: () => void;
}

const LoginForm = observer(({ onForgotPassword }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      return;
    }

    try {
      await authStore.login(email.trim(), password);
    } catch {
      // Error is handled by the store
    }
  };

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
            authStore.clearError();
          }}
          placeholder="you@example.com"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
          autoFocus
          autoComplete="email"
        />
      </div>

      <div className="mb-2">
        <label className="block text-gray-700 text-sm font-medium mb-2">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            authStore.clearError();
          }}
          placeholder="Enter your password"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
          autoComplete="current-password"
        />
      </div>

      <div className="mb-4 text-right">
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-sm text-blue-500 hover:text-blue-600"
        >
          Forgot password?
        </button>
      </div>

      {authStore.error && (
        <p className="text-red-500 text-sm mb-4">{authStore.error}</p>
      )}

      <button
        type="submit"
        disabled={authStore.isLoading || !email.trim() || !password}
        className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {authStore.isLoading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
});

export default LoginForm;
