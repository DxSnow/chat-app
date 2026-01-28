const rateLimit = new Map();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimit.entries()) {
    if (record.timestamps.length === 0 || record.timestamps[record.timestamps.length - 1] < now - 3600000) {
      rateLimit.delete(key);
    }
  }
}, 60000);

function createRateLimiter(options) {
  const { windowMs = 60000, max = 5, keyGenerator } = options;

  return async (ctx, next) => {
    const key = keyGenerator ? keyGenerator(ctx) : ctx.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    let record = rateLimit.get(key);

    if (!record) {
      record = { timestamps: [] };
      rateLimit.set(key, record);
    }

    // Remove old timestamps
    record.timestamps = record.timestamps.filter(t => t > windowStart);

    if (record.timestamps.length >= max) {
      ctx.status = 429;
      ctx.body = {
        error: 'Too many requests, please try again later',
        retryAfter: Math.ceil((record.timestamps[0] + windowMs - now) / 1000),
      };
      return;
    }

    record.timestamps.push(now);
    await next();
  };
}

// Login: 5 attempts per 15 minutes per email
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (ctx) => `login:${ctx.request.body?.email || ctx.ip}`,
});

// OTP request: 1 per minute per email
const otpRequestLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 1,
  keyGenerator: (ctx) => `otp:${ctx.request.body?.email || ctx.ip}`,
});

// OTP verify: 5 attempts per 15 minutes per email
const otpVerifyLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (ctx) => `otp-verify:${ctx.request.body?.email || ctx.ip}`,
});

// Registration: 3 per hour per IP
const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyGenerator: (ctx) => `register:${ctx.ip}`,
});

module.exports = {
  createRateLimiter,
  loginLimiter,
  otpRequestLimiter,
  otpVerifyLimiter,
  registerLimiter,
};
