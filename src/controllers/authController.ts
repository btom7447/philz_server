import { Request, Response } from "express";
import User from "../models/User";
import jwt from "jsonwebtoken";

const generateToken = (id: string, role: string) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET!, { expiresIn: "1h" });
};

export const loginSuperAdmin = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, role: "super-admin" });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = generateToken(user._id.toString(), user.role);

  res.json({
    token,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};