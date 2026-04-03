"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inquiryController_1 = require("../controllers/inquiryController");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const validateRequest_1 = require("../middleware/validateRequest");
const validatorSchemas_1 = require("../utils/validatorSchemas");
const validateObjectId_1 = require("../middleware/validateObjectId");
const router = (0, express_1.Router)();
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
router.post("/", rateLimiter_1.publicLimiter, (0, validateRequest_1.validateRequest)(validatorSchemas_1.inquirySchema), inquiryController_1.createInquiry);
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
router.get("/", auth_1.protect, (0, auth_1.authorize)("admin"), inquiryController_1.getAllInquiries);
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
router.get("/property/:propertyId", (0, validateObjectId_1.validateObjectId)("propertyId"), inquiryController_1.getPropertyInquiries);
exports.default = router;
