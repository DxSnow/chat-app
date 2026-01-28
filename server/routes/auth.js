const Router = require('@koa/router');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const User = require('../models/User');
const { authMiddleware, generateToken } = require('../middleware/auth');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimit');
const { sendWelcomeEmail } = require('../services/emailService');

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
const MAX_USERS = 20; // Registration limit

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

// Secret word is used instead of security questions for simpler password recovery

// POST /api/auth/register - Register with email/password
router.post('/register', requireDatabase, registerLimiter, async (ctx) => {
  const { email, password, username, securityQuestion, securityAnswer } = ctx.request.body;

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

  // Validate secret word
  if (!securityAnswer) {
    ctx.status = 400;
    ctx.body = { error: 'Secret word is required' };
    return;
  }

  if (securityAnswer.trim().length < 2) {
    ctx.status = 400;
    ctx.body = { error: 'Secret word must be at least 2 characters' };
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
    if (/\s/.test(username.trim())) {
      ctx.status = 400;
      ctx.body = { error: 'Username cannot contain spaces' };
      return;
    }
  }

  // Check registration limit
  const userCount = await User.countDocuments();
  if (userCount >= MAX_USERS) {
    ctx.status = 403;
    ctx.body = { error: 'Registration is currently closed. Maximum number of users reached.' };
    return;
  }

  // Check if user exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    ctx.status = 409;
    ctx.body = { error: 'An account with this email already exists' };
    return;
  }

  // Hash password and security answer
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const hashedAnswer = await bcrypt.hash(securityAnswer.trim().toLowerCase(), SALT_ROUNDS);
  // Use provided username or fall back to email prefix
  const displayName = username ? username.trim() : User.extractDisplayName(email);

  const user = new User({
    email: email.toLowerCase(),
    password: hashedPassword,
    displayName,
    authMethod: 'password',
    isVerified: true,
    securityAnswer: hashedAnswer,
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

// PUT /api/auth/profile - Update user profile (display name)
router.put('/profile', requireDatabase, authMiddleware, async (ctx) => {
  const { displayName } = ctx.request.body;

  if (!displayName || !displayName.trim()) {
    ctx.status = 400;
    ctx.body = { error: 'Display name is required' };
    return;
  }

  const trimmedName = displayName.trim();

  if (trimmedName.length < 2) {
    ctx.status = 400;
    ctx.body = { error: 'Display name must be at least 2 characters' };
    return;
  }

  if (trimmedName.length > 20) {
    ctx.status = 400;
    ctx.body = { error: 'Display name must be 20 characters or less' };
    return;
  }

  if (/\s/.test(trimmedName)) {
    ctx.status = 400;
    ctx.body = { error: 'Display name cannot contain spaces' };
    return;
  }

  const user = await User.findById(ctx.state.user.userId);

  if (!user) {
    ctx.status = 404;
    ctx.body = { error: 'User not found' };
    return;
  }

  user.displayName = trimmedName;
  await user.save();

  ctx.body = {
    success: true,
    user: {
      id: user._id,
      email: user.email,
      displayName: user.displayName,
    },
  };
});

// POST /api/auth/logout - Logout (mainly for client-side cleanup notification)
router.post('/logout', authMiddleware, async (ctx) => {
  // For JWT, logout is mainly client-side (delete token)
  // This endpoint can be used for logging/analytics
  ctx.body = { success: true, message: 'Logged out successfully' };
});

// POST /api/auth/forgot-password/verify-email - Verify email exists for password reset
router.post('/forgot-password/verify-email', requireDatabase, loginLimiter, async (ctx) => {
  const { email } = ctx.request.body;

  if (!email || !isValidEmail(email)) {
    ctx.status = 400;
    ctx.body = { error: 'Valid email is required' };
    return;
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+securityAnswer');

  if (!user) {
    ctx.status = 404;
    ctx.body = { error: 'No account found with this email' };
    return;
  }

  if (!user.securityAnswer) {
    ctx.status = 400;
    ctx.body = { error: 'No secret word set for this account. Please contact your teacher.' };
    return;
  }

  ctx.body = {
    success: true,
  };
});

// GET /api/auth/admin/users - List all registered users (admin only)
router.get('/admin/users', requireDatabase, async (ctx) => {
  const adminToken = ctx.headers['x-admin-token'];
  const expectedToken = process.env.ADMIN_TOKEN;

  if (!expectedToken) {
    ctx.status = 503;
    ctx.body = { error: 'Admin functionality not configured' };
    return;
  }

  if (!adminToken || adminToken !== expectedToken) {
    ctx.status = 401;
    ctx.body = { error: 'Invalid admin token' };
    return;
  }

  const users = await User.find({}, 'email displayName createdAt lastLogin').sort({ createdAt: -1 });

  ctx.body = {
    total: users.length,
    maxUsers: MAX_USERS,
    users: users.map(u => ({
      id: u._id,
      email: u.email,
      displayName: u.displayName,
      createdAt: u.createdAt,
      lastLogin: u.lastLogin,
    })),
  };
});

// DELETE /api/auth/admin/users/:id - Delete a user (admin only)
router.delete('/admin/users/:id', requireDatabase, async (ctx) => {
  const adminToken = ctx.headers['x-admin-token'];
  const expectedToken = process.env.ADMIN_TOKEN;

  if (!expectedToken) {
    ctx.status = 503;
    ctx.body = { error: 'Admin functionality not configured' };
    return;
  }

  if (!adminToken || adminToken !== expectedToken) {
    ctx.status = 401;
    ctx.body = { error: 'Invalid admin token' };
    return;
  }

  const { id } = ctx.params;

  const user = await User.findById(id);
  if (!user) {
    ctx.status = 404;
    ctx.body = { error: 'User not found' };
    return;
  }

  await User.findByIdAndDelete(id);

  ctx.body = {
    success: true,
    message: `User ${user.email} has been deleted`,
  };
});

// POST /api/auth/forgot-password/reset - Reset password using secret word
router.post('/forgot-password/reset', requireDatabase, loginLimiter, async (ctx) => {
  const { email, secretWord, newPassword } = ctx.request.body;

  if (!email || !secretWord || !newPassword) {
    ctx.status = 400;
    ctx.body = { error: 'Email, secret word, and new password are required' };
    return;
  }

  const passwordErrors = validatePassword(newPassword);
  if (passwordErrors.length > 0) {
    ctx.status = 400;
    ctx.body = { error: passwordErrors[0] };
    return;
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+securityAnswer +password');

  if (!user) {
    ctx.status = 404;
    ctx.body = { error: 'No account found with this email' };
    return;
  }

  if (!user.securityAnswer) {
    ctx.status = 400;
    ctx.body = { error: 'No secret word set for this account' };
    return;
  }

  // Check if account is locked
  if (user.isLocked()) {
    ctx.status = 423;
    ctx.body = { error: 'Account is temporarily locked. Please try again later.' };
    return;
  }

  // Verify secret word (case-insensitive)
  const isWordValid = await bcrypt.compare(secretWord.trim().toLowerCase(), user.securityAnswer);

  if (!isWordValid) {
    // Increment login attempts (reuse the same lock mechanism)
    user.loginAttempts += 1;
    if (user.loginAttempts >= 5) {
      user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
    }
    await user.save();

    ctx.status = 401;
    ctx.body = { error: 'Incorrect secret word' };
    return;
  }

  // Reset password
  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  user.password = hashedPassword;
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  if (user.authMethod === 'otp') {
    user.authMethod = 'both';
  }
  await user.save();

  ctx.body = {
    success: true,
    message: 'Password has been reset successfully',
  };
});

module.exports = router;
