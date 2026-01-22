import { Request, Response } from "express";
import crypto from "crypto";
import User, { IUser } from "../models/User";
import { generateToken } from "../utils/generateToken";
import jwt from "jsonwebtoken";

// Helper function to format user response
const formatUserResponse = (user: IUser) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  avatarUrl: user.avatarUrl || "",
});

// ----------------------
// REGISTER
// ----------------------
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password } = req.body;

    // Input validation
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const role: IUser["role"] = email.endsWith("@philzproperties.com")
      ? "admin"
      : "user";

    const user = await User.create({ name, email, phone, password, role });

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
// LOGIN
// ----------------------
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id.toString(), user.role);

    res.json({
      token,
      user: formatUserResponse(user),
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

    res.json({
      user: {
        id: req.user._id.toString(),
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        avatarUrl: req.user.avatarUrl || "",
      },
    });
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
    // Read token from cookie
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ authenticated: false });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      role: string;
    };

    // Fetch user
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ authenticated: false });
    }

    // Respond with shape matching AuthStore.User
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
export const logout = (req: Request, res: Response) => {
  res.cookie("token", "", { httpOnly: true, expires: new Date(0) });
  res.json({ message: "Logged out successfully" });
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

    // TODO: send resetToken via email only
    // const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    // await sendEmail({ to: email, subject: "Reset Password", text: resetUrl });

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
// UPDATE PROFILE AVATAR
// ----------------------
export const updateAvatar = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId; // or get from auth middleware: req.user.id
    const { avatarUrl } = req.body;

    if (!avatarUrl) {
      return res.status(400).json({ message: "Avatar URL is required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.avatarUrl = avatarUrl;
    await user.save();

    res.json({
      message: "Profile avatar updated successfully",
      avatarUrl: user.avatarUrl,
    });
  } catch (err) {
    console.error("Update avatar error:", err);
    res.status(500).json({ message: "Server error" });
  }
};