import { Request, Response, NextFunction } from "express";

const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Server Error";
  if (process.env.NODE_ENV === "production") {
    res.status(statusCode).json({ message });
  } else {
    res.status(statusCode).json({ message, stack: err.stack });
  }
};

export default errorHandler;