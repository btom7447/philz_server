import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import TokenBlacklist from "../models/TokenBlacklist";

interface JwtPayload {
  id: string;
  role: "admin" | "user";
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let token: string | undefined;

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
    const blacklisted = await TokenBlacklist.findOne({ token });
    if (blacklisted) {
      return res.status(401).json({ message: "Token has been revoked" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalid or expired" });
  }
};

export const authorize =
  (...roles: ("admin" | "user")[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // For admin routes, also check adminApproved
    if (roles.includes("admin") && req.user.role === "admin" && !req.user.adminApproved) {
      return res.status(403).json({ message: "Admin access pending approval" });
    }

    next();
  };
