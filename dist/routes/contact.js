"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const contactController_1 = require("../controllers/contactController");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
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
router.post("/", rateLimiter_1.publicLimiter, contactController_1.createContact);
/**
 * @swagger
 * /api/contact:
 *   get:
 *     summary: Get all contact messages (super-admin only)
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all contact messages
 */
router.get("/", auth_1.protect, (0, auth_1.authorize)("super-admin"), contactController_1.getAllContacts);
exports.default = router;
