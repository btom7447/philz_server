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
        const { name, email, phone, message } = req.body;
        if (!name || !email || !message) {
            return res
                .status(400)
                .json({ message: "Name, email, and message are required" });
        }
        const contact = await Contact_1.default.create({ name, email, phone, message });
        res.status(201).json({ message: "Message submitted", contact });
    }
    catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
exports.createContact = createContact;
// Get all contact messages (admin only)
const getAllContacts = async (req, res) => {
    try {
        const contacts = await Contact_1.default.find().sort({ createdAt: -1 }).lean();
        res.json(contacts);
    }
    catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
exports.getAllContacts = getAllContacts;
