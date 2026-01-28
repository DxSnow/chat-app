import { useState, useRef, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { authStore } from '../../stores/AuthStore';

interface OTPFormProps {
  onBack: () => void;
}

const OTPForm = observer(({ onBack }: OTPFormProps) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    // Clear error when typing
    if (authStore.error) {
      authStore.clearError();
    }

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (index === 5 && value) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        handleSubmit(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace - go to previous input
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);

    if (pastedData) {
      const newCode = [...code];
      for (let i = 0; i < pastedData.length; i++) {
        newCode[i] = pastedData[i];
      }
      setCode(newCode);

      // Focus the next empty input or the last one
      const nextEmptyIndex = newCode.findIndex(c => !c);
      if (nextEmptyIndex === -1) {
        inputRefs.current[5]?.focus();
        // Auto-submit if all 6 digits pasted
        if (pastedData.length === 6) {
          handleSubmit(pastedData);
        }
      } else {
        inputRefs.current[nextEmptyIndex]?.focus();
      }
    }
  };

  const handleSubmit = async (fullCode?: string) => {
    const codeToVerify = fullCode || code.join('');
    if (codeToVerify.length !== 6) return;

    try {
      await authStore.verifyOTP(authStore.otpEmail, codeToVerify);
    } catch {
      // Error handled by store
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    setCode(['', '', '', '', '', '']);
    try {
      await authStore.requestOTP(authStore.otpEmail);
      inputRefs.current[0]?.focus();
    } catch {
      // Error handled by store
    }
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-2 text-gray-800">
        Enter verification code
      </h3>
      <p className="text-gray-600 mb-6">
        We sent a 6-digit code to <span className="font-medium">{authStore.otpEmail}</span>
      </p>

      <div className="flex gap-2 justify-center mb-4">
        {code.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-800 transition-colors"
          />
        ))}
      </div>

      {authStore.error && (
        <p className="text-red-500 text-sm mb-4 text-center">{authStore.error}</p>
      )}

      <button
        onClick={() => handleSubmit()}
        disabled={authStore.isLoading || code.join('').length !== 6}
        className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {authStore.isLoading ? 'Verifying...' : 'Verify Code'}
      </button>

      <div className="flex justify-between mt-4">
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-800 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleResend}
          disabled={authStore.isLoading}
          className="text-blue-500 hover:text-blue-600 transition-colors disabled:opacity-50"
        >
          Resend code
        </button>
      </div>

      <p className="text-gray-500 text-xs mt-6 text-center">
        The code expires in 10 minutes
      </p>
    </div>
  );
});

export default OTPForm;
