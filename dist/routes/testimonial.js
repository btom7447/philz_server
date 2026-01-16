"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const testimonialController_1 = require("../controllers/testimonialController");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   name: Testimonials
 *   description: Client testimonials management
 */
// ============================
// PUBLIC (WEBSITE)
// ============================
/**
 * @swagger
 * /api/testimonials/public:
 *   get:
 *     summary: Get approved testimonials (public)
 *     tags: [Testimonials]
 *     responses:
 *       200:
 *         description: List of approved testimonials
 *       500:
 *         description: Server error
 */
router.get("/public", testimonialController_1.getPublicTestimonials);
// ============================
// CREATE (CLIENT)
// ============================
/**
 * @swagger
 * /api/testimonials:
 *   post:
 *     summary: Create a testimonial (client)
 *     tags: [Testimonials]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: name
 *         type: string
 *         required: true
 *       - in: formData
 *         name: title
 *         type: string
 *         required: true
 *       - in: formData
 *         name: content
 *         type: string
 *         required: true
 *       - in: formData
 *         name: rating
 *         type: number
 *         minimum: 1
 *         maximum: 5
 *         required: true
 *       - in: formData
 *         name: files
 *         type: file
 *         required: false
 *         description: Testimonial image
 *     responses:
 *       201:
 *         description: Testimonial created
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post("/", auth_1.protect, (0, auth_1.authorize)("client"), upload_1.upload.array("files", 1), testimonialController_1.createTestimonial);
// ============================
// GET ALL (ADMIN)
// ============================
/**
 * @swagger
 * /api/testimonials:
 *   get:
 *     summary: Get all testimonials (admin)
 *     tags: [Testimonials]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of testimonials
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/", auth_1.protect, (0, auth_1.authorize)("super-admin"), testimonialController_1.getAllTestimonials);
// ============================
// GET ONE
// ============================
/**
 * @swagger
 * /api/testimonials/{id}:
 *   get:
 *     summary: Get a testimonial by ID
 *     tags: [Testimonials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Testimonial found
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Not found
 */
router.get("/:id", auth_1.protect, (0, auth_1.authorize)("super-admin"), testimonialController_1.getTestimonialById);
// ============================
// UPDATE
// ============================
/**
 * @swagger
 * /api/testimonials/{id}:
 *   put:
 *     summary: Update a testimonial
 *     tags: [Testimonials]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         type: string
 *       - in: formData
 *         name: name
 *         type: string
 *       - in: formData
 *         name: title
 *         type: string
 *       - in: formData
 *         name: content
 *         type: string
 *       - in: formData
 *         name: rating
 *         type: number
 *         minimum: 1
 *         maximum: 5
 *       - in: formData
 *         name: files
 *         type: file
 *         description: Replace image
 *     responses:
 *       200:
 *         description: Updated successfully
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Not found
 */
router.put("/:id", auth_1.protect, (0, auth_1.authorize)("super-admin"), upload_1.upload.array("files", 1), testimonialController_1.updateTestimonial);
// ============================
// APPROVE / UNAPPROVE
// ============================
/**
 * @swagger
 * /api/testimonials/{id}/approve:
 *   patch:
 *     summary: Approve or unapprove a testimonial
 *     tags: [Testimonials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         type: string
 *       - in: body
 *         name: body
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             approved:
 *               type: boolean
 *               example: true
 *     responses:
 *       200:
 *         description: Status updated
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Not found
 */
router.patch("/:id/approve", auth_1.protect, (0, auth_1.authorize)("super-admin"), testimonialController_1.approveTestimonial);
// ============================
// DELETE
// ============================
/**
 * @swagger
 * /api/testimonials/{id}:
 *   delete:
 *     summary: Delete a testimonial
 *     tags: [Testimonials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Deleted successfully
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Not found
 */
router.delete("/:id", auth_1.protect, (0, auth_1.authorize)("super-admin"), testimonialController_1.deleteTestimonial);
exports.default = router;
