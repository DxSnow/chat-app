import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { authStore } from '../../stores/AuthStore';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

type Step = 'email' | 'reset' | 'success';

const ForgotPasswordForm = observer(({ onBack }: ForgotPasswordFormProps) => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [secretWord, setSecretWord] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!email.trim()) {
      setLocalError('Please enter your email');
      return;
    }

    const success = await authStore.verifyEmailForReset(email.trim());
    if (success) {
      setStep('reset');
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!secretWord.trim()) {
      setLocalError('Please enter your secret word');
      return;
    }

    if (!newPassword) {
      setLocalError('Please enter a new password');
      return;
    }

    if (newPassword.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    const success = await authStore.resetPassword(email.trim(), secretWord.trim(), newPassword);
    if (success) {
      setStep('success');
    }
  };

  const displayError = localError || authStore.error;

  if (step === 'success') {
    return (
      <div className="text-center">
        <div className="text-green-500 text-5xl mb-4">&#10003;</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Password Reset!</h3>
        <p className="text-gray-600 mb-6">
          Your password has been successfully reset. You can now sign in with your new password.
        </p>
        <button
          onClick={onBack}
          className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
        >
          Back to Login
        </button>
      </div>
    );
  }

  if (step === 'reset') {
    return (
      <form onSubmit={handleResetSubmit}>
        <button
          type="button"
          onClick={() => {
            setStep('email');
            setSecretWord('');
            setNewPassword('');
            setConfirmPassword('');
            authStore.clearError();
          }}
          className="text-blue-500 hover:text-blue-600 mb-4 flex items-center gap-1"
        >
          &larr; Back
        </button>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Your Secret Word
          </label>
          <input
            type="text"
            value={secretWord}
            onChange={(e) => {
              setSecretWord(e.target.value);
              setLocalError('');
              authStore.clearError();
            }}
            placeholder="Enter your secret word"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
            autoFocus
            autoComplete="off"
          />
          <p className="text-gray-500 text-xs mt-1">Enter the secret word you chose when you created your account</p>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            New Password
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
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
            Confirm New Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setLocalError('');
              authStore.clearError();
            }}
            placeholder="Confirm your new password"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
            autoComplete="new-password"
          />
        </div>

        {displayError && (
          <p className="text-red-500 text-sm mb-4">{displayError}</p>
        )}

        <button
          type="submit"
          disabled={authStore.isLoading || !secretWord.trim() || !newPassword || !confirmPassword}
          className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {authStore.isLoading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleEmailSubmit}>
      <button
        type="button"
        onClick={onBack}
        className="text-blue-500 hover:text-blue-600 mb-4 flex items-center gap-1"
      >
        &larr; Back to Login
      </button>

      <p className="text-gray-600 mb-4">
        Enter your email address and then your secret word to reset your password.
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
            setLocalError('');
            authStore.clearError();
          }}
          placeholder="you@example.com"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
          autoFocus
          autoComplete="email"
        />
      </div>

      {displayError && (
        <p className="text-red-500 text-sm mb-4">{displayError}</p>
      )}

      <button
        type="submit"
        disabled={authStore.isLoading || !email.trim()}
        className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {authStore.isLoading ? 'Loading...' : 'Continue'}
      </button>
    </form>
  );
});

export default ForgotPasswordForm;
