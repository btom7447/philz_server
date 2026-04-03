import rateLimit from "express-rate-limit";

// General public endpoint limiter
export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, try again later",
});

// Strict limiter for login/auth endpoints (prevent brute force)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login attempts, please try again in 15 minutes",
  skipSuccessfulRequests: true,
});

// Strict limiter for password reset (per IP)
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: "Too many password reset requests, please try again later",
});

// Webhook limiter (generous but still limited)
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: "Too many webhook requests",
});
