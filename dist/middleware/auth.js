"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const protect = async (req, res, next) => {
    let token = req.headers.authorization?.split(" ")[1];
    if (!token)
        return res.status(401).json({ message: "Not authorized" });
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await User_1.default.findById(decoded.id).select("-password");
        if (!user)
            return res.status(401).json({ message: "Not authorized" });
        req.user = user;
        next();
    }
    catch (err) {
        console.error("JWT verification error:", err);
        return res.status(401).json({ message: "Token invalid or expired" });
    }
};
exports.protect = protect;
const authorize = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Forbidden" });
    }
    next();
};
exports.authorize = authorize;
