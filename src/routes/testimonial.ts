import { Router } from "express";
import {
  createTestimonial,
  getAllTestimonials,
  getTestimonialById,
  updateTestimonial,
  approveTestimonial,
  deleteTestimonial,
  getPublicTestimonials,
} from "../controllers/testimonialController";
import { protect, authorize } from "../middleware/auth";
import { upload } from "../middleware/upload";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Testimonials
 *   description: User testimonials management
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
router.get("/public", getPublicTestimonials);

// ============================
// CREATE (USER)
// ============================
/**
 * @swagger
 * /api/testimonials:
 *   post:
 *     summary: Create a testimonial (user)
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
router.post(
  "/",
  protect,
  authorize("user"),
  upload.array("files", 1),
  createTestimonial
);

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
router.get("/", protect, authorize("admin"), getAllTestimonials);

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
router.get("/:id", protect, authorize("admin"), getTestimonialById);

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
router.put(
  "/:id",
  protect,
  authorize("admin"),
  upload.array("files", 1),
  updateTestimonial
);

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
router.patch(
  "/:id/approve",
  protect,
  authorize("admin"),
  approveTestimonial
);

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
router.delete("/:id", protect, authorize("admin"), deleteTestimonial);

export default router;