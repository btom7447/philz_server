"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAccount = exports.updateProfile = exports.resetPassword = exports.forgotPassword = exports.refreshToken = exports.logout = exports.getSession = exports.getCurrentUser = exports.login = exports.getPendingAdmins = exports.approveAdmin = exports.verifyEmail = exports.register = void 0;
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const TokenBlacklist_1 = __importDefault(require("../models/TokenBlacklist"));
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
const generateToken_1 = require("../utils/generateToken");
const email_1 = require("../utils/email");
const FRONTEND_URL = process.env.NODE_ENV === "production"
    ? process.env.PROD_FRONTEND_URL
    : process.env.DEV_FRONTEND_URL;
// Helper function to format user response
const formatUserResponse = (user) => ({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatarUrl: user.avatarUrl || "",
    emailVerified: user.emailVerified,
    adminApproved: user.adminApproved,
});
// ----------------------
// REGISTER
// ----------------------
const register = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        if (!name || !email || !phone || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser)
            return res.status(400).json({ message: "User already exists" });
        const isAdminDomain = email.endsWith("@philzproperties.com");
        const role = isAdminDomain ? "admin" : "user";
        // Generate email verification token
        const verificationToken = crypto_1.default.randomBytes(32).toString("hex");
        const hashedVerificationToken = crypto_1.default
            .createHash("sha256")
            .update(verificationToken)
            .digest("hex");
        const user = await User_1.default.create({
            name,
            email,
            phone,
            password,
            role,
            adminApproved: !isAdminDomain, // Regular users are auto-approved, admin emails need super-admin approval
            emailVerified: false,
            emailVerificationToken: hashedVerificationToken,
            emailVerificationExpire: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        });
        // Send verification email
        const verifyUrl = `${FRONTEND_URL}/verify-email?token=${verificationToken}`;
        await (0, email_1.sendEmail)({
            to: email,
            subject: "Verify your email - Philz Properties",
            html: (0, email_1.emailVerificationEmail)(verifyUrl),
        }).catch((err) => console.error("Verification email error:", err));
        // If admin domain, notify existing super-admins
        if (isAdminDomain) {
            const superAdmins = await User_1.default.find({
                role: "admin",
                adminApproved: true,
                emailVerified: true,
            });
            for (const admin of superAdmins) {
                await (0, email_1.sendEmail)({
                    to: admin.email,
                    subject: "New Admin Approval Request - Philz Properties",
                    html: (0, email_1.adminApprovalRequestEmail)(name, email),
                }).catch((err) => console.error("Admin notification error:", err));
            }
            return res.status(201).json({
                message: "Account created. Please verify your email. Your admin access is pending approval from an existing administrator.",
                user: formatUserResponse(user),
                pendingApproval: true,
            });
        }
        const token = (0, generateToken_1.generateToken)(user._id.toString(), user.role);
        res.status(201).json({
            token,
            user: formatUserResponse(user),
        });
    }
    catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
exports.register = register;
// ----------------------
// VERIFY EMAIL
// ----------------------
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token)
            return res.status(400).json({ message: "Token is required" });
        const hashedToken = crypto_1.default.createHash("sha256").update(token).digest("hex");
        const user = await User_1.default.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpire: { $gt: Date.now() },
        });
        if (!user) {
            return res.status(400).json({ message: "Token invalid or expired" });
        }
        user.emailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpire = undefined;
        await user.save({ validateBeforeSave: false });
        res.json({ message: "Email verified successfully" });
    }
    catch (err) {
        console.error("Verify email error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
exports.verifyEmail = verifyEmail;
// ----------------------
// APPROVE ADMIN (super-admin only)
// ----------------------
const approveAdmin = async (req, res) => {
    try {
        const { userId, approved } = req.body;
        if (!userId)
            return res.status(400).json({ message: "userId is required" });
        const targetUser = await User_1.default.findById(userId);
        if (!targetUser)
            return res.status(404).json({ message: "User not found" });
        if (targetUser.role !== "admin") {
            return res.status(400).json({ message: "User is not an admin candidate" });
        }
        if (approved) {
            targetUser.adminApproved = true;
            await targetUser.save({ validateBeforeSave: false });
            await (0, email_1.sendEmail)({
                to: targetUser.email,
                subject: "Admin Access Approved - Philz Properties",
                html: (0, email_1.adminApprovedEmail)(targetUser.name),
            }).catch((err) => console.error("Approval email error:", err));
        }
        else {
            // Deny: downgrade to user role
            targetUser.role = "user";
            targetUser.adminApproved = true; // mark as processed
            await targetUser.save({ validateBeforeSave: false });
            await (0, email_1.sendEmail)({
                to: targetUser.email,
                subject: "Admin Access Denied - Philz Properties",
                html: (0, email_1.adminDeniedEmail)(targetUser.name),
            }).catch((err) => console.error("Denial email error:", err));
        }
        await AuditLog_1.default.create({
            userId: req.user._id,
            action: approved ? "approve" : "deny",
            resource: "user",
            resourceId: userId,
            ip: req.ip,
        });
        res.json({
            message: approved ? "Admin access approved" : "Admin access denied",
        });
    }
    catch (err) {
        console.error("Approve admin error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
exports.approveAdmin = approveAdmin;
// ----------------------
// GET PENDING ADMINS (super-admin only)
// ----------------------
const getPendingAdmins = async (_req, res) => {
    try {
        const pendingAdmins = await User_1.default.find({
            role: "admin",
            adminApproved: false,
        }).select("-password");
        res.json(pendingAdmins);
    }
    catch (err) {
        console.error("Get pending admins error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
exports.getPendingAdmins = getPendingAdmins;
// ----------------------
// LOGIN
// ----------------------
const login = async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
        const user = await User_1.default.findOne({ email }).select("+password");
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        // Check if admin domain user is approved
        if (user.role === "admin" && !user.adminApproved) {
            return res.status(403).json({
                message: "Your admin access is pending approval. Please contact an existing administrator.",
                pendingApproval: true,
            });
        }
        const expiresIn = rememberMe ? "30d" : "1h";
        const token = (0, generateToken_1.generateToken)(user._id.toString(), user.role, expiresIn);
        await AuditLog_1.default.create({
            userId: user._id,
            action: "login",
            resource: "user",
            resourceId: user._id.toString(),
            ip: req.ip,
        });
        res.json({
            token,
            user: formatUserResponse(user),
            expiresIn,
        });
    }
    catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
exports.login = login;
// ----------------------
// GET CURRENT USER
// ----------------------
const getCurrentUser = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Not authorized" });
        res.json({ user: formatUserResponse(req.user) });
    }
    catch (err) {
        console.error("Get current user error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
exports.getCurrentUser = getCurrentUser;
// ----------------------
// SESSION
// ----------------------
const getSession = async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ authenticated: false });
        }
        // Check blacklist
        const blacklisted = await TokenBlacklist_1.default.findOne({ token });
        if (blacklisted) {
            return res.status(401).json({ authenticated: false });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await User_1.default.findById(decoded.id).select("-password");
        if (!user) {
            return res.status(401).json({ authenticated: false });
        }
        return res.status(200).json({
            authenticated: true,
            user: formatUserResponse(user),
        });
    }
    catch (err) {
        console.error("Session check error:", err);
        return res.status(401).json({ authenticated: false });
    }
};
exports.getSession = getSession;
// ----------------------
// LOGOUT
// ----------------------
const logout = async (req, res) => {
    try {
        // Blacklist current token
        const token = req.cookies.token ||
            req.headers.authorization?.replace("Bearer ", "");
        if (token) {
            try {
                const decoded = jsonwebtoken_1.default.decode(token);
                const expiresAt = decoded?.exp
                    ? new Date(decoded.exp * 1000)
                    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // fallback 30 days
                await TokenBlacklist_1.default.create({ token, expiresAt });
            }
            catch {
                // If token is invalid, just clear cookie
            }
        }
        res.cookie("token", "", { httpOnly: true, expires: new Date(0) });
        res.json({ message: "Logged out successfully" });
    }
    catch (err) {
        console.error("Logout error:", err);
        res.json({ message: "Logged out successfully" });
    }
};
exports.logout = logout;
// ----------------------
// REFRESH TOKEN
// ----------------------
const refreshToken = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Not authorized" });
        // Blacklist old token
        const oldToken = req.cookies.token ||
            req.headers.authorization?.replace("Bearer ", "");
        if (oldToken) {
            const decoded = jsonwebtoken_1.default.decode(oldToken);
            const expiresAt = decoded?.exp
                ? new Date(decoded.exp * 1000)
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            await TokenBlacklist_1.default.create({ token: oldToken, expiresAt }).catch(() => { });
        }
        const newToken = (0, generateToken_1.generateToken)(req.user._id.toString(), req.user.role);
        res.json({ token: newToken });
    }
    catch (err) {
        console.error("Refresh token error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
exports.refreshToken = refreshToken;
// ----------------------
// FORGOT PASSWORD
// ----------------------
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User_1.default.findOne({ email });
        if (!user)
            return res.status(404).json({ message: "User not found" });
        const resetToken = crypto_1.default.randomBytes(32).toString("hex");
        const hashedToken = crypto_1.default
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
        await user.save({ validateBeforeSave: false });
        const resetUrl = `${FRONTEND_URL}/reset-password/${resetToken}`;
        await (0, email_1.sendEmail)({
            to: email,
            subject: "Reset your password - Philz Properties",
            html: (0, email_1.passwordResetEmail)(resetUrl),
        });
        res.json({ message: "Password reset email sent" });
    }
    catch (err) {
        console.error("Forgot password error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
exports.forgotPassword = forgotPassword;
// ----------------------
// RESET PASSWORD
// ----------------------
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const hashedToken = crypto_1.default.createHash("sha256").update(token).digest("hex");
        const user = await User_1.default.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() },
        }).select("+password");
        if (!user)
            return res.status(400).json({ message: "Token invalid or expired" });
        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
        const jwtToken = (0, generateToken_1.generateToken)(user._id.toString(), user.role);
        res.json({ message: "Password reset successful", token: jwtToken });
    }
    catch (err) {
        console.error("Reset password error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
exports.resetPassword = resetPassword;
// ----------------------
// UPDATE PROFILE
// ----------------------
const updateProfile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Not authorized" });
        }
        const { name, phone, avatarUrl } = req.body;
        const user = await User_1.default.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (name !== undefined)
            user.name = name;
        if (phone !== undefined)
            user.phone = phone;
        if (avatarUrl !== undefined)
            user.avatarUrl = avatarUrl;
        await user.save();
        res.json({
            message: "Profile updated successfully",
            user: formatUserResponse(user),
        });
    }
    catch (err) {
        console.error("Update profile error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
exports.updateProfile = updateProfile;
// ----------------------
// DELETE ACCOUNT (soft delete + cascade)
// ----------------------
const deleteAccount = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Not authorized" });
        const user = await User_1.default.findById(req.user._id);
        if (!user)
            return res.status(404).json({ message: "User not found" });
        // Soft-delete user
        user.isDeleted = true;
        await user.save({ validateBeforeSave: false });
        // Soft-delete related data
        const mongoose = await Promise.resolve().then(() => __importStar(require("mongoose")));
        const TourRequest = mongoose.default.model("TourRequest");
        const Payment = mongoose.default.model("Payment");
        await TourRequest.updateMany({ userId: user._id }, { $set: { isDeleted: true } });
        await Payment.updateMany({ userId: user._id }, { $set: { isDeleted: true } });
        await AuditLog_1.default.create({
            userId: user._id,
            action: "delete",
            resource: "user",
            resourceId: user._id.toString(),
            ip: req.ip,
        });
        res.cookie("token", "", { httpOnly: true, expires: new Date(0) });
        res.json({ message: "Account deleted successfully" });
    }
    catch (err) {
        console.error("Delete account error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
exports.deleteAccount = deleteAccount;
