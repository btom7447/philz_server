import { Request, Response } from "express";
import Inquiry from "../models/Inquiry";

// Submit a new inquiry
export const createInquiry = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, message, propertyId } = req.body;

    if (!name || !email || !phone || !message) {
      return res.status(400).json({ message: "All fields are required" });
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
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get all inquiries (admin)
export const getAllInquiries = async (_req: Request, res: Response) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });
    res.json(inquiries);
  } catch (err: any) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get inquiries for a specific property (for property details page)
export const getPropertyInquiries = async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;

    if (!propertyId)
      return res.status(400).json({ message: "Property ID required" });

    const inquiries = await Inquiry.find({ propertyId })
      .sort({ createdAt: -1 })
      .lean();
    res.json(inquiries);
  } catch (err: any) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};