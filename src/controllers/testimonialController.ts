import { Request, Response } from "express";
import mongoose from "mongoose";
import Testimonial from "../models/Testimonial";
import cloudinary from "../utils/cloudinary";

// ============================
// CREATE TESTIMONIAL
// ============================
export const createTestimonial = async (req: Request, res: Response) => {
  try {
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

    let images: { url: string; public_id: string }[] = [];

    if (req.files && (req.files as Express.Multer.File[]).length > 0) {
      for (const file of req.files as Express.Multer.File[]) {
        const uploaded = await cloudinary.uploader.upload(file.path, {
          folder: "testimonials/images",
          resource_type: "image",
        });

        images.push({ url: uploaded.secure_url, public_id: uploaded.public_id });
      }
    }

    const testimonial = await Testimonial.create({
      name,
      title,
      content,
      rating: numericRating,
      images,
      approved: false,
    });

    res.status(201).json({ message: "Testimonial created", testimonial });
  } catch (err: any) {
    console.error("Create testimonial error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ============================
// UPDATE TESTIMONIAL
// ============================
export const updateTestimonial = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ message: "Invalid testimonial ID" });

    const testimonial = await Testimonial.findById(id);
    if (!testimonial) return res.status(404).json({ message: "Not found" });

    const { name, title, content, rating, approved } = req.body;

    if (name) testimonial.name = name;
    if (title) testimonial.title = title;
    if (content) testimonial.content = content;
    if (rating) testimonial.rating = Number(rating);
    if (approved !== undefined) testimonial.approved = approved;

    if (req.files && (req.files as Express.Multer.File[]).length > 0) {
      for (const file of req.files as Express.Multer.File[]) {
        const uploaded = await cloudinary.uploader.upload(file.path, {
          folder: "testimonials/images",
          resource_type: "image",
        });
        testimonial.images.push({ url: uploaded.secure_url, public_id: uploaded.public_id });
      }
    }

    await testimonial.save();
    res.json({ message: "Testimonial updated", testimonial });
  } catch (err: any) {
    console.error("Update testimonial error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ============================
// GET ALL TESTIMONIALS (ADMIN)
// ============================
export const getAllTestimonials = async (_req: Request, res: Response) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    res.json(testimonials);
  } catch (err: any) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ============================
// GET PUBLIC TESTIMONIALS (WEBSITE)
// ============================
export const getPublicTestimonials = async (_req: Request, res: Response) => {
  try {
    const testimonials = await Testimonial.find({ approved: true }).sort({
      createdAt: -1,
    });
    res.json(testimonials);
  } catch (err: any) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ============================
// GET SINGLE TESTIMONIAL
// ============================
export const getTestimonialById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid testimonial ID" });
    }

    const testimonial = await Testimonial.findById(id);
    if (!testimonial) return res.status(404).json({ message: "Not found" });

    res.json(testimonial);
  } catch (err: any) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ============================
// APPROVE / UNAPPROVE (ADMIN)
// ============================
export const approveTestimonial = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid testimonial ID" });
    }

    const testimonial = await Testimonial.findById(id);
    if (!testimonial) return res.status(404).json({ message: "Not found" });

    testimonial.approved = Boolean(req.body.approved);
    await testimonial.save();

    res.json({ message: "Status updated", testimonial });
  } catch (err: any) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ============================
// DELETE TESTIMONIAL (ADMIN)
// ============================
export const deleteTestimonial = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid testimonial ID" });
    }

    const testimonial = await Testimonial.findByIdAndDelete(id);
    if (!testimonial) return res.status(404).json({ message: "Not found" });

    res.json({ message: "Testimonial deleted" });
  } catch (err: any) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};