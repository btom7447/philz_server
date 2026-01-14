import { Request, Response } from "express";
import Testimonial from "../models/Testimonial";

export const createTestimonial = async (req: Request, res: Response) => {
  const testimonial = await Testimonial.create({
    content: req.body.content,
    userId: req.user!._id,
  });
  res.status(201).json(testimonial);
};

export const getAllTestimonials = async (req: Request, res: Response) => {
  const testimonials = await Testimonial.find();
  res.json(testimonials);
};

export const approveTestimonial = async (req: Request, res: Response) => {
  const testimonial = await Testimonial.findById(req.params.id);
  if (!testimonial) return res.status(404).json({ message: "Not found" });
  testimonial.approved = req.body.approved;
  await testimonial.save();
  res.json(testimonial);
};