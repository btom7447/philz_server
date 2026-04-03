"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPropertyInquiries = exports.getAllInquiries = exports.createInquiry = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Inquiry_1 = __importDefault(require("../models/Inquiry"));
// Submit a new inquiry
const createInquiry = async (req, res) => {
    try {
        const { name, email, phone, message, propertyId } = req.body;
        if (!name || !email || !phone || !message) {
            return res.status(400).json({ message: "All fields are required" });
        }
        if (propertyId && !mongoose_1.default.isValidObjectId(propertyId)) {
            return res.status(400).json({ message: "Invalid property ID" });
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
        res.status(500).json({ message: "Server error" });
    }
};
exports.createInquiry = createInquiry;
// Get all inquiries (admin) — with pagination
const getAllInquiries = async (req, res) => {
    try {
        const { page = "1", pageSize = "20" } = req.query;
        const pageNum = Math.max(Number(page) || 1, 1);
        const limit = Math.min(Number(pageSize) || 20, 100);
        const skip = (pageNum - 1) * limit;
        const [inquiries, total] = await Promise.all([
            Inquiry_1.default.find({ isDeleted: { $ne: true } })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Inquiry_1.default.countDocuments({ isDeleted: { $ne: true } }),
        ]);
        res.json({
            inquiries,
            meta: { page: pageNum, pageSize: limit, total, totalPages: Math.ceil(total / limit) },
        });
    }
    catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.getAllInquiries = getAllInquiries;
// Get inquiries for a specific property
const getPropertyInquiries = async (req, res) => {
    try {
        const { propertyId } = req.params;
        if (!mongoose_1.default.isValidObjectId(propertyId)) {
            return res.status(400).json({ message: "Invalid property ID" });
        }
        const inquiries = await Inquiry_1.default.find({ propertyId, isDeleted: { $ne: true } })
            .sort({ createdAt: -1 })
            .lean();
        res.json(inquiries);
    }
    catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.getPropertyInquiries = getPropertyInquiries;
