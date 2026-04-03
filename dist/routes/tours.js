"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tourController_1 = require("../controllers/tourController");
const auth_1 = require("../middleware/auth");
const validateRequest_1 = require("../middleware/validateRequest");
const validatorSchemas_1 = require("../utils/validatorSchemas");
const validateObjectId_1 = require("../middleware/validateObjectId");
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
router.post("/", auth_1.protect, (0, validateRequest_1.validateRequest)(validatorSchemas_1.tourRequestSchema), tourController_1.requestTour);
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
 *     responses:
 *       200:
 *         description: Tour rescheduled
 */
router.patch("/:id/reschedule", auth_1.protect, (0, validateObjectId_1.validateObjectId)("id"), tourController_1.rescheduleTour);
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
router.patch("/:id/cancel", auth_1.protect, (0, validateObjectId_1.validateObjectId)("id"), tourController_1.cancelTour);
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
router.get("/admin/all", auth_1.protect, (0, auth_1.authorize)("admin"), tourController_1.getAllTours);
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
router.patch("/:id/approve", auth_1.protect, (0, auth_1.authorize)("admin"), (0, validateObjectId_1.validateObjectId)("id"), tourController_1.approveTour);
exports.default = router;
