"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookLimiter = exports.passwordResetLimiter = exports.authLimiter = exports.publicLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// General public endpoint limiter
exports.publicLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests, try again later",
});
// Strict limiter for login/auth endpoints (prevent brute force)
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many login attempts, please try again in 15 minutes",
    skipSuccessfulRequests: true,
});
// Strict limiter for password reset (per IP)
exports.passwordResetLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: "Too many password reset requests, please try again later",
});
// Webhook limiter (generous but still limited)
exports.webhookLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 100,
    message: "Too many webhook requests",
});
