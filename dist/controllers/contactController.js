"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllContacts = exports.createContact = void 0;
const Contact_1 = __importDefault(require("../models/Contact"));
// Submit a new contact message
const createContact = async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;
        if (!name || !email || !message) {
            return res
                .status(400)
                .json({ message: "Name, email, and message are required" });
        }
        const contact = await Contact_1.default.create({ name, email, phone, subject, message });
        res.status(201).json({ message: "Message submitted", contact });
    }
    catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.createContact = createContact;
// Get all contact messages (admin only) — with pagination
const getAllContacts = async (req, res) => {
    try {
        const { page = "1", pageSize = "20" } = req.query;
        const pageNum = Math.max(Number(page) || 1, 1);
        const limit = Math.min(Number(pageSize) || 20, 100);
        const skip = (pageNum - 1) * limit;
        const [contacts, total] = await Promise.all([
            Contact_1.default.find({ isDeleted: { $ne: true } })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Contact_1.default.countDocuments({ isDeleted: { $ne: true } }),
        ]);
        res.json({
            contacts,
            meta: { page: pageNum, pageSize: limit, total, totalPages: Math.ceil(total / limit) },
        });
    }
    catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.getAllContacts = getAllContacts;
