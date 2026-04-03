import { Request, Response } from "express";
import mongoose from "mongoose";
import Inquiry from "../models/Inquiry";

// Submit a new inquiry
export const createInquiry = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, message, propertyId } = req.body;

    if (!name || !email || !phone || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (propertyId && !mongoose.isValidObjectId(propertyId)) {
      return res.status(400).json({ message: "Invalid property ID" });
    }

    const inquiry = await Inquiry.create({
      name,
      email,
      phone,
      message,
      propertyId,
    });
    res.status(201).json({ message: "Inquiry submitted", inquiry });
  } catch (err: any) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get all inquiries (admin) — with pagination
export const getAllInquiries = async (req: Request, res: Response) => {
  try {
    const { page = "1", pageSize = "20" } = req.query;

    const pageNum = Math.max(Number(page) || 1, 1);
    const limit = Math.min(Number(pageSize) || 20, 100);
    const skip = (pageNum - 1) * limit;

    const [inquiries, total] = await Promise.all([
      Inquiry.find({ isDeleted: { $ne: true } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Inquiry.countDocuments({ isDeleted: { $ne: true } }),
    ]);

    res.json({
      inquiries,
      meta: { page: pageNum, pageSize: limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err: any) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get inquiries for a specific property
export const getPropertyInquiries = async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;

    if (!mongoose.isValidObjectId(propertyId)) {
      return res.status(400).json({ message: "Invalid property ID" });
    }

    const inquiries = await Inquiry.find({ propertyId, isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .lean();
    res.json(inquiries);
  } catch (err: any) {
    res.status(500).json({ message: "Server error" });
  }
};
