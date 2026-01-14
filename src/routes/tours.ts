import { Router } from "express";
import {
  requestTour,
  getAllTours,
  approveTour,
} from "../controllers/tourController";
import { protect, authorize } from "../middleware/auth";
import { publicLimiter } from "../middleware/rateLimiter";

/**
 * @swagger
 * tags:
 *   name: Tours
 *   description: Tour requests
 */

const router = Router();

/**
 * @swagger
 * /api/tours:
 *   post:
 *     summary: Request a property tour
 *     tags: [Tours]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               propertyId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [virtual, in-person]
 *     responses:
 *       201:
 *         description: Tour requested
 */
router.post("/", protect, publicLimiter, requestTour);

/**
 * @swagger
 * /api/tours:
 *   get:
 *     summary: Get all tours (super-admin only)
 *     tags: [Tours]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tour requests
 */
router.get("/", protect, authorize("super-admin"), getAllTours);

/**
 * @swagger
 * /api/tours/{id}/approve:
 *   patch:
 *     summary: Approve or reject a tour (super-admin only)
 *     tags: [Tours]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tour request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *     responses:
 *       200:
 *         description: Tour updated
 */
router.patch("/:id/approve", protect, authorize("super-admin"), approveTour);

export default router;