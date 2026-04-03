import { Router } from "express";
import {
  createInquiry,
  getAllInquiries,
  getPropertyInquiries,
} from "../controllers/inquiryController";
import { protect, authorize } from "../middleware/auth";
import { publicLimiter } from "../middleware/rateLimiter";
import { validateRequest } from "../middleware/validateRequest";
import { inquirySchema } from "../utils/validatorSchemas";
import { validateObjectId } from "../middleware/validateObjectId";

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
 *     responses:
 *       201:
 *         description: Inquiry submitted
 */
router.post("/", publicLimiter, validateRequest(inquirySchema), createInquiry);

/**
 * @swagger
 * /api/inquiries:
 *   get:
 *     summary: Get all inquiries (admin only, paginated)
 *     tags: [Inquiries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of inquiries
 */
router.get("/", protect, authorize("admin"), getAllInquiries);

/**
 * @swagger
 * /api/inquiries/property/{propertyId}:
 *   get:
 *     summary: Get all inquiries for a specific property
 *     tags: [Inquiries]
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of inquiries for the property
 */
router.get("/property/:propertyId", validateObjectId("propertyId"), getPropertyInquiries);

export default router;
