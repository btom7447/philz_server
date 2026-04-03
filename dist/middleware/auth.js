"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const TokenBlacklist_1 = __importDefault(require("../models/TokenBlacklist"));
const protect = async (req, res, next) => {
    let token;
    // 1. Check Authorization header
    if (req.headers.authorization?.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }
    // 2. Fallback to httpOnly cookie
    if (!token && req.cookies?.token) {
        token = req.cookies.token;
    }
    if (!token) {
        return res.status(401).json({ message: "Not authorized" });
    }
    try {
        // Check token blacklist
        const blacklisted = await TokenBlacklist_1.default.findOne({ token });
        if (blacklisted) {
            return res.status(401).json({ message: "Token has been revoked" });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await User_1.default.findById(decoded.id).select("-password");
        if (!user) {
            return res.status(401).json({ message: "Not authorized" });
        }
        req.user = user;
        next();
    }
    catch (err) {
        return res.status(401).json({ message: "Token invalid or expired" });
    }
};
exports.protect = protect;
const authorize = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Forbidden" });
    }
    // For admin routes, also check adminApproved
    if (roles.includes("admin") && req.user.role === "admin" && !req.user.adminApproved) {
        return res.status(403).json({ message: "Admin access pending approval" });
    }
    next();
};
exports.authorize = authorize;
