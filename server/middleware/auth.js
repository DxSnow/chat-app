const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// JWT verification middleware for HTTP routes
async function authMiddleware(ctx, next) {
  const authHeader = ctx.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    ctx.status = 401;
    ctx.body = { error: 'No token provided' };
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    ctx.state.user = decoded;
    await next();
  } catch (error) {
    ctx.status = 401;
    ctx.body = { error: 'Invalid or expired token' };
  }
}

// Optional auth - allows unauthenticated access but attaches user if present
async function optionalAuthMiddleware(ctx, next) {
  const authHeader = ctx.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      ctx.state.user = decoded;
    } catch (error) {
      // Token invalid, but continue without user
    }
  }

  await next();
}

// Verify WebSocket token
function verifyWebSocketToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Generate JWT token
function generateToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '24h' }
  );
}

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  verifyWebSocketToken,
  generateToken,
  JWT_SECRET,
};
