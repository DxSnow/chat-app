const Router = require('@koa/router');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { authMiddleware, generateToken } = require('../middleware/auth');
const { loginLimiter, otpRequestLimiter, otpVerifyLimiter, registerLimiter } = require('../middleware/rateLimit');
const { sendOTPEmail, sendWelcomeEmail } = require('../services/emailService');

const router = new Router({ prefix: '/api/auth' });

// Middleware to check database connection
async function requireDatabase(ctx, next) {
  if (mongoose.connection.readyState !== 1) {
    ctx.status = 503;
    ctx.body = { error: 'Database not connected. Please try again later.' };
    return;
  }
  await next();
}

const SALT_ROUNDS = 12;
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 3;

// Generate 6-digit OTP
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
function validatePassword(password) {
  const errors = [];
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  return errors;
}

// POST /api/auth/register - Register with email/password
router.post('/register', requireDatabase, registerLimiter, async (ctx) => {
  const { email, password, username } = ctx.request.body;

  if (!email || !isValidEmail(email)) {
    ctx.status = 400;
    ctx.body = { error: 'Valid email is required' };
    return;
  }

  if (!password) {
    ctx.status = 400;
    ctx.body = { error: 'Password is required' };
    return;
  }

  const passwordErrors = validatePassword(password);
  if (passwordErrors.length > 0) {
    ctx.status = 400;
    ctx.body = { error: passwordErrors[0] };
    return;
  }

  // Validate username if provided
  if (username) {
    if (username.trim().length < 2) {
      ctx.status = 400;
      ctx.body = { error: 'Username must be at least 2 characters' };
      return;
    }
    if (username.trim().length > 20) {
      ctx.status = 400;
      ctx.body = { error: 'Username must be 20 characters or less' };
      return;
    }
  }

  // Check if user exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    ctx.status = 409;
    ctx.body = { error: 'An account with this email already exists' };
    return;
  }

  // Hash password and create user
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  // Use provided username or fall back to email prefix
  const displayName = username ? username.trim() : User.extractDisplayName(email);

  const user = new User({
    email: email.toLowerCase(),
    password: hashedPassword,
    displayName,
    authMethod: 'password',
    isVerified: true,
  });

  await user.save();

  // Generate token
  const token = generateToken(user);

  // Send welcome email (non-blocking)
  sendWelcomeEmail(email, displayName).catch(console.error);

  ctx.body = {
    success: true,
    token,
    user: {
      id: user._id,
      email: user.email,
      displayName: user.displayName,
    },
  };
});

// POST /api/auth/login - Login with email/password
router.post('/login', requireDatabase, loginLimiter, async (ctx) => {
  const { email, password } = ctx.request.body;

  if (!email || !password) {
    ctx.status = 400;
    ctx.body = { error: 'Email and password are required' };
    return;
  }

  // Find user with password field
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    ctx.status = 401;
    ctx.body = { error: 'Invalid email or password' };
    return;
  }

  // Check if account is locked
  if (user.isLocked()) {
    ctx.status = 423;
    ctx.body = { error: 'Account is temporarily locked. Please try again later.' };
    return;
  }

  // Check if user has a password (might be OTP-only)
  if (!user.password) {
    ctx.status = 401;
    ctx.body = { error: 'This account uses passwordless login. Please use the code option.' };
    return;
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    // Increment login attempts
    user.loginAttempts += 1;
    if (user.loginAttempts >= 5) {
      user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
    }
    await user.save();

    ctx.status = 401;
    ctx.body = { error: 'Invalid email or password' };
    return;
  }

  // Reset login attempts on successful login
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  user.lastLogin = new Date();
  await user.save();

  const token = generateToken(user);

  ctx.body = {
    success: true,
    token,
    user: {
      id: user._id,
      email: user.email,
      displayName: user.displayName,
    },
  };
});

// POST /api/auth/otp/request - Request OTP code
router.post('/otp/request', requireDatabase, otpRequestLimiter, async (ctx) => {
  const { email } = ctx.request.body;

  if (!email || !isValidEmail(email)) {
    ctx.status = 400;
    ctx.body = { error: 'Valid email is required' };
    return;
  }

  const normalizedEmail = email.toLowerCase();

  // Delete any existing OTPs for this email
  await OTP.deleteMany({ email: normalizedEmail });

  // Generate new OTP
  const code = generateOTP();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  const otp = new OTP({
    email: normalizedEmail,
    code,
    purpose: 'login',
    expiresAt,
  });

  await otp.save();

  // Send OTP email
  try {
    await sendOTPEmail(normalizedEmail, code);
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to send verification code. Please try again.' };
    return;
  }

  ctx.body = {
    success: true,
    message: 'Verification code sent to your email',
  };
});

// POST /api/auth/otp/verify - Verify OTP and login
router.post('/otp/verify', requireDatabase, otpVerifyLimiter, async (ctx) => {
  const { email, code, username } = ctx.request.body;

  if (!email || !code) {
    ctx.status = 400;
    ctx.body = { error: 'Email and code are required' };
    return;
  }

  const normalizedEmail = email.toLowerCase();

  // Find OTP
  const otp = await OTP.findOne({ email: normalizedEmail });

  if (!otp) {
    ctx.status = 401;
    ctx.body = { error: 'No verification code found. Please request a new one.' };
    return;
  }

  // Check expiration
  if (otp.expiresAt < new Date()) {
    await OTP.deleteOne({ _id: otp._id });
    ctx.status = 401;
    ctx.body = { error: 'Code has expired. Please request a new one.' };
    return;
  }

  // Check code
  if (otp.code !== code) {
    otp.attempts += 1;

    if (otp.attempts >= MAX_OTP_ATTEMPTS) {
      await OTP.deleteOne({ _id: otp._id });
      ctx.status = 401;
      ctx.body = { error: 'Too many failed attempts. Please request a new code.' };
      return;
    }

    await otp.save();
    ctx.status = 401;
    ctx.body = { error: 'Invalid code. Please try again.' };
    return;
  }

  // Delete OTP after successful verification
  await OTP.deleteOne({ _id: otp._id });

  // Find or create user
  let user = await User.findOne({ email: normalizedEmail });
  let isNewUser = false;

  if (!user) {
    // Create new user with OTP-only auth
    // Use provided username or fall back to email prefix
    const displayName = username ? username.trim() : User.extractDisplayName(normalizedEmail);
    user = new User({
      email: normalizedEmail,
      displayName,
      authMethod: 'otp',
      isVerified: true,
    });
    await user.save();
    isNewUser = true;

    // Send welcome email (non-blocking)
    sendWelcomeEmail(normalizedEmail, displayName).catch(console.error);
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  const token = generateToken(user);

  ctx.body = {
    success: true,
    token,
    user: {
      id: user._id,
      email: user.email,
      displayName: user.displayName,
    },
    isNewUser,
  };
});

// GET /api/auth/me - Get current user info
router.get('/me', requireDatabase, authMiddleware, async (ctx) => {
  const user = await User.findById(ctx.state.user.userId);

  if (!user) {
    ctx.status = 404;
    ctx.body = { error: 'User not found' };
    return;
  }

  ctx.body = {
    id: user._id,
    email: user.email,
    displayName: user.displayName,
    authMethod: user.authMethod,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
  };
});

// POST /api/auth/logout - Logout (mainly for client-side cleanup notification)
router.post('/logout', authMiddleware, async (ctx) => {
  // For JWT, logout is mainly client-side (delete token)
  // This endpoint can be used for logging/analytics
  ctx.body = { success: true, message: 'Logged out successfully' };
});

module.exports = router;
