import { Router } from "express";
import {
  requestTour,
  getUserTours,
  getAllTours,
  approveTour,
  rescheduleTour,
  cancelTour,
} from "../controllers/tourController";
import { protect, authorize } from "../middleware/auth";
import { validateRequest } from "../middleware/validateRequest";
import { tourRequestSchema } from "../utils/validatorSchemas";
import { validateObjectId } from "../middleware/validateObjectId";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Tours
 *   description: Manage property tour requests
 */

/**
 * @swagger
 * /api/tours:
 *   post:
 *     summary: Request a new tour (user)
 *     tags: [Tours]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - propertyId
 *               - type
 *               - tourTime
 *             properties:
 *               propertyId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [virtual, in-person]
 *               tourTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Tour requested successfully
 */
router.post("/", protect, validateRequest(tourRequestSchema), requestTour);

/**
 * @swagger
 * /api/tours:
 *   get:
 *     summary: Get tours requested by the current user
 *     tags: [Tours]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, canceled]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [virtual, in-person]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: -tourTime
 *     responses:
 *       200:
 *         description: List of user's tours with pagination
 */
router.get("/", protect, getUserTours);

/**
 * @swagger
 * /api/tours/{id}/reschedule:
 *   patch:
 *     summary: Reschedule a user's tour
 *     tags: [Tours]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tour rescheduled
 */
router.patch("/:id/reschedule", protect, validateObjectId("id"), rescheduleTour);

/**
 * @swagger
 * /api/tours/{id}/cancel:
 *   patch:
 *     summary: Cancel a user's tour
 *     tags: [Tours]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tour canceled
 */
router.patch("/:id/cancel", protect, validateObjectId("id"), cancelTour);

/**
 * @swagger
 * /api/tours/admin/all:
 *   get:
 *     summary: Get all tour requests (admin)
 *     tags: [Tours]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
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
 *         description: All tours with pagination
 */
router.get("/admin/all", protect, authorize("admin"), getAllTours);

/**
 * @swagger
 * /api/tours/{id}/approve:
 *   patch:
 *     summary: Approve or reject a tour (admin)
 *     tags: [Tours]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tour status updated
 */
router.patch("/:id/approve", protect, authorize("admin"), validateObjectId("id"), approveTour);

export default router;
