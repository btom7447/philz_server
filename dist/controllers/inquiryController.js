"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPropertyInquiries = exports.getAllInquiries = exports.createInquiry = void 0;
const Inquiry_1 = __importDefault(require("../models/Inquiry"));
// Submit a new inquiry
const createInquiry = async (req, res) => {
    try {
        const { name, email, phone, message, propertyId } = req.body;
        if (!name || !email || !phone || !message) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const inquiry = await Inquiry_1.default.create({
            name,
            email,
            phone,
            message,
            propertyId,
        });
        res.status(201).json({ message: "Inquiry submitted", inquiry });
    }
    catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
exports.createInquiry = createInquiry;
// Get all inquiries (admin)
const getAllInquiries = async (_req, res) => {
    try {
        const inquiries = await Inquiry_1.default.find().sort({ createdAt: -1 });
        res.json(inquiries);
    }
    catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
exports.getAllInquiries = getAllInquiries;
// Get inquiries for a specific property (for property details page)
const getPropertyInquiries = async (req, res) => {
    try {
        const { propertyId } = req.params;
        if (!propertyId)
            return res.status(400).json({ message: "Property ID required" });
        const inquiries = await Inquiry_1.default.find({ propertyId })
            .sort({ createdAt: -1 })
            .lean();
        res.json(inquiries);
    }
    catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
exports.getPropertyInquiries = getPropertyInquiries;
