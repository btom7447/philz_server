import { Router } from "express";
import {
  createInquiry,
  getAllInquiries,
  getPropertyInquiries,
} from "../controllers/inquiryController";
import { protect, authorize } from "../middleware/auth";
import { publicLimiter } from "../middleware/rateLimiter";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Inquiries
 *   description: Property inquiries
 */

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
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               message:
 *                 type: string
 *               propertyId:
 *                 type: string
 *                 description: Optional property ID
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

/**
 * @swagger
 * /api/inquiries/property/{propertyId}:
 *   get:
 *     summary: Get all inquiries for a specific property (public)
 *     tags: [Inquiries]
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
 *     responses:
 *       200:
 *         description: List of inquiries for the property
 */
router.get("/property/:propertyId", getPropertyInquiries);

export default router;