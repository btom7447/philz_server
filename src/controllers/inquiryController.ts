import { Request, Response } from "express";
import Inquiry from "../models/Inquiry";

export const createInquiry = async (req: Request, res: Response) => {
  const inquiry = await Inquiry.create(req.body);
  res.status(201).json(inquiry);
};

export const getAllInquiries = async (req: Request, res: Response) => {
  const inquiries = await Inquiry.find();
  res.json(inquiries);
};