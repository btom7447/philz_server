import jwt from "jsonwebtoken";

export const generateToken = (id: string, role: "admin" | "user") => {
  const secret = process.env.JWT_SECRET;
  if (!secret)
    throw new Error("JWT_SECRET is not defined in environment variables");

  return jwt.sign({ id, role }, secret, { expiresIn: "1h" });
};