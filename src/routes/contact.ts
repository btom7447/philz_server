import { Router } from "express";
import {
  createContact,
  getAllContacts,
} from "../controllers/contactController";
import { protect, authorize } from "../middleware/auth";
import { publicLimiter } from "../middleware/rateLimiter";
import { validateRequest } from "../middleware/validateRequest";
import { contactSchema } from "../utils/validatorSchemas";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Contact
 *   description: Site contact form submissions
 */

/**
 * @swagger
 * /api/contact:
 *   post:
 *     summary: Submit a contact message
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
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
 *     responses:
 *       201:
 *         description: Contact message submitted
 */
router.post("/", publicLimiter, validateRequest(contactSchema), createContact);

/**
 * @swagger
 * /api/contact:
 *   get:
 *     summary: Get all contact messages (admin only, paginated)
 *     tags: [Contact]
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
 *         description: List of all contact messages
 */
router.get("/", protect, authorize("admin"), getAllContacts);

export default router;
