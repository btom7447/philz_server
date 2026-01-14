import { Router } from "express";
import {
  createTestimonial,
  getAllTestimonials,
  approveTestimonial,
} from "../controllers/testimonialController";
import { protect, authorize } from "../middleware/auth";

/**
 * @swagger
 * tags:
 *   name: Testimonials
 *   description: Client testimonials
 */

const router = Router();

// Create testimonial (client)
router.post("/", protect, authorize("client"), createTestimonial);

// Get all testimonials (super-admin)
router.get("/", protect, authorize("super-admin"), getAllTestimonials);

// Approve testimonial (super-admin)
router.patch(
  "/:id/approve",
  protect,
  authorize("super-admin"),
  approveTestimonial
);

export default router;