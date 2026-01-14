import { Router } from "express";
import {
  createInquiry,
  getAllInquiries,
} from "../controllers/inquiryController";
import { protect, authorize } from "../middleware/auth";
import { publicLimiter } from "../middleware/rateLimiter";

/**
 * @swagger
 * tags:
 *   name: Inquiries
 *   description: Property inquiries
 */

const router = Router();

/**
 * @swagger
 * /api/inquiries:
 *   post:
 *     summary: Submit an inquiry
 *     tags: [Inquiries]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               message:
 *                 type: string
 *               propertyId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Inquiry submitted
 */
router.post("/", publicLimiter, createInquiry);

/**
 * @swagger
 * /api/inquiries:
 *   get:
 *     summary: Get all inquiries (super-admin only)
 *     tags: [Inquiries]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of inquiries
 */
router.get("/", protect, authorize("super-admin"), getAllInquiries);

export default router;