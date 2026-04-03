import { Request, Response, NextFunction } from "express";

const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  console.error(err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Server error";

  // Never expose stack traces to clients
  res.status(statusCode).json({ message });
};

export default errorHandler;
