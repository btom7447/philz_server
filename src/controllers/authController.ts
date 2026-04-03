import { Request, Response } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";
import TokenBlacklist from "../models/TokenBlacklist";
import AuditLog from "../models/AuditLog";
import { generateToken } from "../utils/generateToken";
import {
  sendEmail,
  passwordResetEmail,
  adminApprovalRequestEmail,
  adminApprovedEmail,
  adminDeniedEmail,
  emailVerificationEmail,
} from "../utils/email";

const FRONTEND_URL =
  process.env.NODE_ENV === "production"
    ? process.env.PROD_FRONTEND_URL
    : process.env.DEV_FRONTEND_URL;

// Helper function to format user response
const formatUserResponse = (user: IUser) => ({
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
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const isAdminDomain = email.endsWith("@philzproperties.com");
    const role: IUser["role"] = isAdminDomain ? "admin" : "user";

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedVerificationToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    const user = await User.create({
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
    await sendEmail({
      to: email,
      subject: "Verify your email - Philz Properties",
      html: emailVerificationEmail(verifyUrl),
    }).catch((err) => console.error("Verification email error:", err));

    // If admin domain, notify existing super-admins
    if (isAdminDomain) {
      const superAdmins = await User.find({
        role: "admin",
        adminApproved: true,
        emailVerified: true,
      });

      for (const admin of superAdmins) {
        await sendEmail({
          to: admin.email,
          subject: "New Admin Approval Request - Philz Properties",
          html: adminApprovalRequestEmail(name, email),
        }).catch((err) => console.error("Admin notification error:", err));
      }

      return res.status(201).json({
        message:
          "Account created. Please verify your email. Your admin access is pending approval from an existing administrator.",
        user: formatUserResponse(user),
        pendingApproval: true,
      });
    }

    const token = generateToken(user._id.toString(), user.role);

    res.status(201).json({
      token,
      user: formatUserResponse(user),
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------
// VERIFY EMAIL
// ----------------------
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Token is required" });

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
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
  } catch (err) {
    console.error("Verify email error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------
// APPROVE ADMIN (super-admin only)
// ----------------------
export const approveAdmin = async (req: Request, res: Response) => {
  try {
    const { userId, approved } = req.body;
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const targetUser = await User.findById(userId);
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    if (targetUser.role !== "admin") {
      return res.status(400).json({ message: "User is not an admin candidate" });
    }

    if (approved) {
      targetUser.adminApproved = true;
      await targetUser.save({ validateBeforeSave: false });

      await sendEmail({
        to: targetUser.email,
        subject: "Admin Access Approved - Philz Properties",
        html: adminApprovedEmail(targetUser.name),
      }).catch((err) => console.error("Approval email error:", err));
    } else {
      // Deny: downgrade to user role
      targetUser.role = "user";
      targetUser.adminApproved = true; // mark as processed
      await targetUser.save({ validateBeforeSave: false });

      await sendEmail({
        to: targetUser.email,
        subject: "Admin Access Denied - Philz Properties",
        html: adminDeniedEmail(targetUser.name),
      }).catch((err) => console.error("Denial email error:", err));
    }

    await AuditLog.create({
      userId: req.user!._id,
      action: approved ? "approve" : "deny",
      resource: "user",
      resourceId: userId,
      ip: req.ip,
    });

    res.json({
      message: approved ? "Admin access approved" : "Admin access denied",
    });
  } catch (err) {
    console.error("Approve admin error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------
// GET PENDING ADMINS (super-admin only)
// ----------------------
export const getPendingAdmins = async (_req: Request, res: Response) => {
  try {
    const pendingAdmins = await User.find({
      role: "admin",
      adminApproved: false,
    }).select("-password");

    res.json(pendingAdmins);
  } catch (err) {
    console.error("Get pending admins error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------
// LOGIN
// ----------------------
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email }).select("+password");
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
    const token = generateToken(user._id.toString(), user.role, expiresIn);

    await AuditLog.create({
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
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------
// GET CURRENT USER
// ----------------------
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authorized" });

    res.json({ user: formatUserResponse(req.user) });
  } catch (err) {
    console.error("Get current user error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------
// SESSION
// ----------------------
export const getSession = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ authenticated: false });
    }

    // Check blacklist
    const blacklisted = await TokenBlacklist.findOne({ token });
    if (blacklisted) {
      return res.status(401).json({ authenticated: false });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      role: string;
    };

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ authenticated: false });
    }

    return res.status(200).json({
      authenticated: true,
      user: formatUserResponse(user),
    });
  } catch (err) {
    console.error("Session check error:", err);
    return res.status(401).json({ authenticated: false });
  }
};

// ----------------------
// LOGOUT
// ----------------------
export const logout = async (req: Request, res: Response) => {
  try {
    // Blacklist current token
    const token =
      req.cookies.token ||
      req.headers.authorization?.replace("Bearer ", "");

    if (token) {
      try {
        const decoded = jwt.decode(token) as { exp?: number } | null;
        const expiresAt = decoded?.exp
          ? new Date(decoded.exp * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // fallback 30 days

        await TokenBlacklist.create({ token, expiresAt });
      } catch {
        // If token is invalid, just clear cookie
      }
    }

    res.cookie("token", "", { httpOnly: true, expires: new Date(0) });
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.json({ message: "Logged out successfully" });
  }
};

// ----------------------
// REFRESH TOKEN
// ----------------------
export const refreshToken = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authorized" });

    // Blacklist old token
    const oldToken =
      req.cookies.token ||
      req.headers.authorization?.replace("Bearer ", "");

    if (oldToken) {
      const decoded = jwt.decode(oldToken) as { exp?: number } | null;
      const expiresAt = decoded?.exp
        ? new Date(decoded.exp * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await TokenBlacklist.create({ token: oldToken, expiresAt }).catch(() => {});
    }

    const newToken = generateToken(req.user._id.toString(), req.user.role);

    res.json({ token: newToken });
  } catch (err) {
    console.error("Refresh token error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------
// FORGOT PASSWORD
// ----------------------
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${FRONTEND_URL}/reset-password/${resetToken}`;
    await sendEmail({
      to: email,
      subject: "Reset your password - Philz Properties",
      html: passwordResetEmail(resetUrl),
    });

    res.json({ message: "Password reset email sent" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------
// RESET PASSWORD
// ----------------------
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select("+password");

    if (!user)
      return res.status(400).json({ message: "Token invalid or expired" });

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const jwtToken = generateToken(user._id.toString(), user.role);

    res.json({ message: "Password reset successful", token: jwtToken });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------
// UPDATE PROFILE
// ----------------------
export const updateProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { name, phone, avatarUrl } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: formatUserResponse(user),
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------
// DELETE ACCOUNT (soft delete + cascade)
// ----------------------
export const deleteAccount = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authorized" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Soft-delete user
    user.isDeleted = true;
    await user.save({ validateBeforeSave: false });

    // Soft-delete related data
    const mongoose = await import("mongoose");
    const TourRequest = mongoose.default.model("TourRequest");
    const Payment = mongoose.default.model("Payment");

    await TourRequest.updateMany(
      { userId: user._id },
      { $set: { isDeleted: true } },
    );
    await Payment.updateMany(
      { userId: user._id },
      { $set: { isDeleted: true } },
    );

    await AuditLog.create({
      userId: user._id,
      action: "delete",
      resource: "user",
      resourceId: user._id.toString(),
      ip: req.ip,
    });

    res.cookie("token", "", { httpOnly: true, expires: new Date(0) });
    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error("Delete account error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
