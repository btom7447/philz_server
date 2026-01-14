import express from "express";
import { IUser } from "../src/models/User";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
