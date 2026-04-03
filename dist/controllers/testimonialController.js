"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTestimonial = exports.approveTestimonial = exports.getTestimonialById = exports.getPublicTestimonials = exports.getAllTestimonials = exports.updateTestimonial = exports.createTestimonial = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Testimonial_1 = __importDefault(require("../models/Testimonial"));
// ============================
// CREATE TESTIMONIAL
// ============================
const createTestimonial = async (req, res) => {
    try {
        const { name, title, content, rating, approved, images } = req.body;
        if (!name || !title || !content || rating === undefined) {
            return res.status(400).json({ message: "All fields required" });
        }
        const testimonial = await Testimonial_1.default.create({
            name,
            title,
            content,
            rating,
            approved: approved ?? false,
            images: images ?? [],
        });
        return res
            .status(201)
            .json({ message: "Testimonial created", testimonial });
    }
    catch (err) {
        console.error("Create testimonial error:", err);
        return res
            .status(500)
            .json({ message: "Server error", error: err.message });
    }
};
exports.createTestimonial = createTestimonial;
// ============================
// UPDATE TESTIMONIAL
// ============================
const updateTestimonial = async (req, res) => {
    try {
        const id = req.params.id;
        if (!mongoose_1.default.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid testimonial ID" });
        }
        const testimonial = await Testimonial_1.default.findById(id);
        if (!testimonial) {
            return res.status(404).json({ message: "Not found" });
        }
        const { name, title, content, rating, approved, images } = req.body;
        if (name !== undefined)
            testimonial.name = name;
        if (title !== undefined)
            testimonial.title = title;
        if (content !== undefined)
            testimonial.content = content;
        if (rating !== undefined)
            testimonial.rating = Number(rating);
        if (approved !== undefined)
            testimonial.approved = approved;
        if (Array.isArray(images) && images.length) {
            testimonial.images = [...testimonial.images, ...images];
        }
        await testimonial.save();
        return res.json({ message: "Testimonial updated", testimonial });
    }
    catch (err) {
        console.error("Update testimonial error:", err);
        return res
            .status(500)
            .json({ message: "Server error", error: err.message });
    }
};
exports.updateTestimonial = updateTestimonial;
// ============================
// GET ALL TESTIMONIALS (ADMIN)
// ============================
const getAllTestimonials = async (_req, res) => {
    try {
        const testimonials = await Testimonial_1.default.find().sort({ createdAt: -1 });
        return res.json(testimonials);
    }
    catch (err) {
        console.error("Get testimonials error:", err);
        return res
            .status(500)
            .json({ message: "Server error", error: err.message });
    }
};
exports.getAllTestimonials = getAllTestimonials;
// ============================
// GET PUBLIC TESTIMONIALS
// ============================
const getPublicTestimonials = async (_req, res) => {
    try {
        const testimonials = await Testimonial_1.default.find({ approved: true }).sort({
            createdAt: -1,
        });
        return res.json(testimonials);
    }
    catch (err) {
        console.error("Get public testimonials error:", err);
        return res
            .status(500)
            .json({ message: "Server error", error: err.message });
    }
};
exports.getPublicTestimonials = getPublicTestimonials;
// ============================
// GET SINGLE TESTIMONIAL
// ============================
const getTestimonialById = async (req, res) => {
    try {
        const id = req.params.id;
        if (!mongoose_1.default.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid testimonial ID" });
        }
        const testimonial = await Testimonial_1.default.findById(id);
        if (!testimonial) {
            return res.status(404).json({ message: "Not found" });
        }
        return res.json(testimonial);
    }
    catch (err) {
        console.error("Get testimonial by ID error:", err);
        return res
            .status(500)
            .json({ message: "Server error", error: err.message });
    }
};
exports.getTestimonialById = getTestimonialById;
// ============================
// APPROVE / UNAPPROVE
// ============================
const approveTestimonial = async (req, res) => {
    try {
        const id = req.params.id;
        if (!mongoose_1.default.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid testimonial ID" });
        }
        const testimonial = await Testimonial_1.default.findById(id);
        if (!testimonial) {
            return res.status(404).json({ message: "Not found" });
        }
        testimonial.approved = Boolean(req.body.approved);
        await testimonial.save();
        return res.json({ message: "Status updated", testimonial });
    }
    catch (err) {
        console.error("Approve testimonial error:", err);
        return res
            .status(500)
            .json({ message: "Server error", error: err.message });
    }
};
exports.approveTestimonial = approveTestimonial;
// ============================
// DELETE TESTIMONIAL
// ============================
const deleteTestimonial = async (req, res) => {
    try {
        const id = req.params.id;
        if (!mongoose_1.default.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid testimonial ID" });
        }
        const testimonial = await Testimonial_1.default.findByIdAndDelete(id);
        if (!testimonial) {
            return res.status(404).json({ message: "Not found" });
        }
        return res.json({ message: "Testimonial deleted" });
    }
    catch (err) {
        console.error("Delete testimonial error:", err);
        return res
            .status(500)
            .json({ message: "Server error", error: err.message });
    }
};
exports.deleteTestimonial = deleteTestimonial;
