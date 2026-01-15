import { Request, Response } from "express";
import Contact from "../models/Contact";

// Submit a new contact message
export const createContact = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ message: "Name, email, and message are required" });
    }

    const contact = await Contact.create({ name, email, phone, message });
    res.status(201).json({ message: "Message submitted", contact });
  } catch (err: any) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get all contact messages (admin only)
export const getAllContacts = async (req: Request, res: Response) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 }).lean();
    res.json(contacts);
  } catch (err: any) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};