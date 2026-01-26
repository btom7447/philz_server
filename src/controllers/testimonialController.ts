import { Request, Response } from "express";
import mongoose from "mongoose";
import Testimonial from "../models/Testimonial";

// ============================
// CREATE TESTIMONIAL
// ============================
export const createTestimonial = async (req: Request, res: Response) => {
  try {
    const { _id, name, title, content, rating, approved, images } = req.body;

    if (!_id || !name || !title || !content || !rating) {
      return res.status(400).json({ message: "All fields required" });
    }

    const testimonial = await Testimonial.create({
      _id,
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
  } catch (err: any) {
    console.error("Create testimonial error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

// ============================
// UPDATE TESTIMONIAL
// ============================
export const updateTestimonial = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid testimonial ID" });
    }

    const testimonial = await Testimonial.findById(id);
    if (!testimonial) {
      return res.status(404).json({ message: "Not found" });
    }

    const { name, title, content, rating, approved, images } = req.body;

    if (name !== undefined) testimonial.name = name;
    if (title !== undefined) testimonial.title = title;
    if (content !== undefined) testimonial.content = content;
    if (rating !== undefined) testimonial.rating = Number(rating);
    if (approved !== undefined) testimonial.approved = approved;

    if (Array.isArray(images) && images.length) {
      testimonial.images = [...testimonial.images, ...images];
    }

    await testimonial.save();
    return res.json({ message: "Testimonial updated", testimonial });
  } catch (err: any) {
    console.error("Update testimonial error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

// ============================
// GET ALL TESTIMONIALS (ADMIN)
// ============================
export const getAllTestimonials = async (_req: Request, res: Response) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    return res.json(testimonials);
  } catch (err: any) {
    console.error("Get testimonials error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

// ============================
// GET PUBLIC TESTIMONIALS
// ============================
export const getPublicTestimonials = async (_req: Request, res: Response) => {
  try {
    const testimonials = await Testimonial.find({ approved: true }).sort({
      createdAt: -1,
    });
    return res.json(testimonials);
  } catch (err: any) {
    console.error("Get public testimonials error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

// ============================
// GET SINGLE TESTIMONIAL
// ============================
export const getTestimonialById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid testimonial ID" });
    }

    const testimonial = await Testimonial.findById(id);
    if (!testimonial) {
      return res.status(404).json({ message: "Not found" });
    }

    return res.json(testimonial);
  } catch (err: any) {
    console.error("Get testimonial by ID error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

// ============================
// APPROVE / UNAPPROVE
// ============================
export const approveTestimonial = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid testimonial ID" });
    }

    const testimonial = await Testimonial.findById(id);
    if (!testimonial) {
      return res.status(404).json({ message: "Not found" });
    }

    testimonial.approved = Boolean(req.body.approved);
    await testimonial.save();

    return res.json({ message: "Status updated", testimonial });
  } catch (err: any) {
    console.error("Approve testimonial error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

// ============================
// DELETE TESTIMONIAL
// ============================
export const deleteTestimonial = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid testimonial ID" });
    }

    const testimonial = await Testimonial.findByIdAndDelete(id);
    if (!testimonial) {
      return res.status(404).json({ message: "Not found" });
    }

    return res.json({ message: "Testimonial deleted" });
  } catch (err: any) {
    console.error("Delete testimonial error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};