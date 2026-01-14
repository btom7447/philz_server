import { Router } from "express";
import {
  createProperty,
  getProperties,
  getPropertyById,
} from "../controllers/propertyController";
import { protect, authorize } from "../middleware/auth";

/**
 * @swagger
 * tags:
 *   name: Properties
 *   description: Property management
 */

const router = Router();

/**
 * @swagger
 * /api/properties:
 *   post:
 *     summary: Create a new property (super-admin only)
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               price:
 *                 type: number
 *               location:
 *                 type: string
 *     responses:
 *       201:
 *         description: Property created
 */
router.post("/", protect, authorize("super-admin"), createProperty);

/**
 * @swagger
 * /api/properties:
 *   get:
 *     summary: Get all properties
 *     tags: [Properties]
 *     responses:
 *       200:
 *         description: List of properties
 */
router.get("/", getProperties);

/**
 * @swagger
 * /api/properties/{id}:
 *   get:
 *     summary: Get property by ID
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
 *     responses:
 *       200:
 *         description: Property details
 *       404:
 *         description: Not found
 */
router.get("/:id", getPropertyById);

export default router;