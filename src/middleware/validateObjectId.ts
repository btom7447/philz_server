import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

/**
 * Middleware to validate that route params are valid MongoDB ObjectIds.
 * Usage: validateObjectId("id") or validateObjectId("id", "propertyId")
 */
export const validateObjectId =
  (...paramNames: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    for (const param of paramNames) {
      const value = req.params[param];
      if (value && !mongoose.isValidObjectId(value)) {
        return res
          .status(400)
          .json({ message: `Invalid ${param}: ${value}` });
      }
    }
    next();
  };
