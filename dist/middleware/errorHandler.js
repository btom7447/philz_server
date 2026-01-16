"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errorHandler = (err, req, res, next) => {
    console.error(err); // <-- log the actual error for dev
    res.status(err.statusCode || 500).json({
        message: err.message || "Server error",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
};
exports.default = errorHandler;
