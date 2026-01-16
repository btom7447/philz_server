"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tourController_1 = require("../controllers/tourController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
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
 *                 description: ID of the property to tour
 *               type:
 *                 type: string
 *                 enum: [virtual, in-person]
 *                 description: Type of tour
 *               tourTime:
 *                 type: string
 *                 format: date-time
 *                 description: Scheduled time for the tour
 *     responses:
 *       201:
 *         description: Tour requested successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post("/", auth_1.protect, tourController_1.requestTour);
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
 *         description: Filter by status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [virtual, in-person]
 *         description: Filter by tour type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: -tourTime
 *         description: Sort field (prefix with - for descending)
 *     responses:
 *       200:
 *         description: List of user's tours with pagination metadata
 *       500:
 *         description: Server error
 */
router.get("/", auth_1.protect, tourController_1.getUserTours);
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
 *         description: Tour ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tourTime
 *             properties:
 *               tourTime:
 *                 type: string
 *                 format: date-time
 *                 description: New tour time
 *     responses:
 *       200:
 *         description: Tour rescheduled successfully
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Tour not found
 *       500:
 *         description: Server error
 */
router.patch("/:id/reschedule", auth_1.protect, tourController_1.rescheduleTour);
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
 *         description: Tour ID
 *     responses:
 *       200:
 *         description: Tour canceled successfully
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Tour not found
 *       500:
 *         description: Server error
 */
router.patch("/:id/cancel", auth_1.protect, tourController_1.cancelTour);
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
 *           enum: [pending, approved, rejected, canceled]
 *         description: Filter by status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [virtual, in-person]
 *         description: Filter by tour type
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 *         description: Filter by property
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: -tourTime
 *         description: Sort field
 *     responses:
 *       200:
 *         description: List of all tours with pagination
 *       500:
 *         description: Server error
 */
router.get("/admin/all", auth_1.protect, (0, auth_1.authorize)("super-admin"), tourController_1.getAllTours);
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
 *         description: Tour ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *                 description: Status to update
 *     responses:
 *       200:
 *         description: Tour approved/rejected successfully
 *       404:
 *         description: Tour not found
 *       500:
 *         description: Server error
 */
router.patch("/:id/approve", auth_1.protect, (0, auth_1.authorize)("super-admin"), tourController_1.approveTour);
exports.default = router;
