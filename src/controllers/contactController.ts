import { Request, Response } from "express";
import Contact from "../models/Contact";

// Submit a new contact message
export const createContact = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ message: "Name, email, and message are required" });
    }

    const contact = await Contact.create({ name, email, phone, subject, message });
    res.status(201).json({ message: "Message submitted", contact });
  } catch (err: any) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get all contact messages (admin only) — with pagination
export const getAllContacts = async (req: Request, res: Response) => {
  try {
    const { page = "1", pageSize = "20" } = req.query;

    const pageNum = Math.max(Number(page) || 1, 1);
    const limit = Math.min(Number(pageSize) || 20, 100);
    const skip = (pageNum - 1) * limit;

    const [contacts, total] = await Promise.all([
      Contact.find({ isDeleted: { $ne: true } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Contact.countDocuments({ isDeleted: { $ne: true } }),
    ]);

    res.json({
      contacts,
      meta: { page: pageNum, pageSize: limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err: any) {
    res.status(500).json({ message: "Server error" });
  }
};
