import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import OTPRequestForm from './OTPRequestForm';
import OTPForm from './OTPForm';
import { authStore } from '../../stores/AuthStore';

type AuthView = 'login' | 'register' | 'otp-request';

const AuthModal = observer(() => {
  const [view, setView] = useState<AuthView>('login');

  // If OTP was sent, show OTP verification
  if (authStore.otpSent) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
          <OTPForm onBack={() => authStore.resetOTPFlow()} />
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
          {view === 'otp-request' && 'Sign in with a one-time code'}
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
          <LoginForm onOTPClick={() => setView('otp-request')} />
        )}
        {view === 'register' && <RegisterForm />}
        {view === 'otp-request' && (
          <OTPRequestForm onBack={() => setView('login')} />
        )}
      </div>
    </div>
  );
});

export default AuthModal;
