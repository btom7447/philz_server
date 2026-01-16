"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTestimonial = exports.approveTestimonial = exports.updateTestimonial = exports.getTestimonialById = exports.getPublicTestimonials = exports.getAllTestimonials = exports.createTestimonial = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Testimonial_1 = __importDefault(require("../models/Testimonial"));
const uploadHelper_1 = require("../utils/uploadHelper");
// ============================
// CREATE TESTIMONIAL (CLIENT)
// ============================
const createTestimonial = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).json({ message: "Request body is missing" });
        }
        const { name, title, content, rating } = req.body;
        if (!name || !title || !content || !rating) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const numericRating = Number(rating);
        if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
            return res
                .status(400)
                .json({ message: "Rating must be a number between 1 and 5" });
        }
        let image;
        if (req.files && req.files.length > 0) {
            const { uploaded, failed } = await (0, uploadHelper_1.uploadFilesToCloudinary)(req.files, "testimonials", "images");
            if (failed.length > 0) {
                return res.status(400).json({
                    message: "Some files failed validation",
                    failed,
                });
            }
            if (uploaded.length > 0) {
                image = uploaded[0].url; // Only one image allowed
            }
        }
        const testimonial = await Testimonial_1.default.create({
            name,
            title,
            content,
            rating: numericRating,
            image,
            approved: false,
        });
        res.status(201).json({ message: "Testimonial created", testimonial });
    }
    catch (err) {
        console.error("Create testimonial error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
exports.createTestimonial = createTestimonial;
// ============================
// GET ALL TESTIMONIALS (ADMIN)
// ============================
const getAllTestimonials = async (_req, res) => {
    try {
        const testimonials = await Testimonial_1.default.find().sort({ createdAt: -1 });
        res.json(testimonials);
    }
    catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
exports.getAllTestimonials = getAllTestimonials;
// ============================
// GET PUBLIC TESTIMONIALS (WEBSITE)
// ============================
const getPublicTestimonials = async (_req, res) => {
    try {
        const testimonials = await Testimonial_1.default.find({ approved: true }).sort({
            createdAt: -1,
        });
        res.json(testimonials);
    }
    catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
exports.getPublicTestimonials = getPublicTestimonials;
// ============================
// GET SINGLE TESTIMONIAL
// ============================
const getTestimonialById = async (req, res) => {
    try {
        const id = String(req.params.id);
        if (!mongoose_1.default.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid testimonial ID" });
        }
        const testimonial = await Testimonial_1.default.findById(id);
        if (!testimonial)
            return res.status(404).json({ message: "Not found" });
        res.json(testimonial);
    }
    catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
exports.getTestimonialById = getTestimonialById;
// ============================
// UPDATE TESTIMONIAL (ADMIN)
// ============================
const updateTestimonial = async (req, res) => {
    try {
        const id = String(req.params.id);
        if (!mongoose_1.default.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid testimonial ID" });
        }
        const testimonial = await Testimonial_1.default.findById(id);
        if (!testimonial)
            return res.status(404).json({ message: "Not found" });
        const { name, title, content, rating, approved } = req.body;
        if (name)
            testimonial.name = name;
        if (title)
            testimonial.title = title;
        if (content)
            testimonial.content = content;
        if (rating)
            testimonial.rating = rating;
        if (approved !== undefined)
            testimonial.approved = approved;
        if (req.files && req.files.length > 0) {
            const { uploaded, failed } = await (0, uploadHelper_1.uploadFilesToCloudinary)(req.files, "testimonials", "images");
            if (failed.length > 0) {
                return res.status(400).json({
                    message: "Some files failed validation",
                    failed,
                });
            }
            if (uploaded.length > 0) {
                testimonial.image = uploaded[0].url;
            }
        }
        await testimonial.save();
        res.json({ message: "Testimonial updated", testimonial });
    }
    catch (err) {
        console.error("Update testimonial error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
exports.updateTestimonial = updateTestimonial;
// ============================
// APPROVE / UNAPPROVE (ADMIN)
// ============================
const approveTestimonial = async (req, res) => {
    try {
        const id = String(req.params.id);
        if (!mongoose_1.default.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid testimonial ID" });
        }
        const testimonial = await Testimonial_1.default.findById(id);
        if (!testimonial)
            return res.status(404).json({ message: "Not found" });
        testimonial.approved = Boolean(req.body.approved);
        await testimonial.save();
        res.json({ message: "Status updated", testimonial });
    }
    catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
exports.approveTestimonial = approveTestimonial;
// ============================
// DELETE TESTIMONIAL (ADMIN)
// ============================
const deleteTestimonial = async (req, res) => {
    try {
        const id = String(req.params.id);
        if (!mongoose_1.default.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid testimonial ID" });
        }
        const testimonial = await Testimonial_1.default.findByIdAndDelete(id);
        if (!testimonial)
            return res.status(404).json({ message: "Not found" });
        res.json({ message: "Testimonial deleted" });
    }
    catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
exports.deleteTestimonial = deleteTestimonial;
