"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errorHandler = (err, _req, res, _next) => {
    console.error(err);
    const statusCode = err.statusCode || 500;
    const message = err.message || "Server error";
    // Never expose stack traces to clients
    res.status(statusCode).json({ message });
};
exports.default = errorHandler;
