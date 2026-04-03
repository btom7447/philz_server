import jwt, { SignOptions } from "jsonwebtoken";

export const generateToken = (
  id: string,
  role: "admin" | "user",
  expiresIn: string = "1h",
) => {
  const secret = process.env.JWT_SECRET;
  if (!secret)
    throw new Error("JWT_SECRET is not defined in environment variables");

  const options: SignOptions = { expiresIn: expiresIn as any };
  return jwt.sign({ id, role }, secret, options);
};
