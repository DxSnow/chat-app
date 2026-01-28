import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ForgotPasswordForm from './ForgotPasswordForm';
import { authStore } from '../../stores/AuthStore';

type AuthView = 'login' | 'register' | 'forgot-password';

const AuthModal = observer(() => {
  const [view, setView] = useState<AuthView>('login');

  // Forgot password flow
  if (view === 'forgot-password') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
          <h2 className="text-2xl font-bold mb-2 text-gray-800">
            Reset Password
          </h2>
          <p className="text-gray-600 mb-6">
            Recover access to your account
          </p>
          <ForgotPasswordForm onBack={() => {
            setView('login');
            authStore.clearError();
          }} />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
        <h2 className="text-2xl font-bold mb-2 text-gray-800">
          Welcome to Chat!
        </h2>
        <p className="text-gray-600 mb-6">
          {view === 'login' && 'Sign in to continue'}
          {view === 'register' && 'Create an account to get started'}
        </p>

        {/* Tab navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => {
              setView('login');
              authStore.clearError();
            }}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              view === 'login'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => {
              setView('register');
              authStore.clearError();
            }}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              view === 'register'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Register
          </button>
        </div>

        {view === 'login' && (
          <LoginForm
            onForgotPassword={() => {
              setView('forgot-password');
              authStore.clearError();
            }}
          />
        )}
        {view === 'register' && <RegisterForm />}
      </div>
    </div>
  );
});

export default AuthModal;
