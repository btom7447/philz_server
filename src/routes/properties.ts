import { Router } from "express";
import {
  createProperty,
  updateProperty,
  deleteProperty,
  getAllProperties,
  getPropertyById,
} from "../controllers/propertyController";
import { protect, authorize } from "../middleware/auth";
import { upload } from "../middleware/upload";
import { validateObjectId } from "../middleware/validateObjectId";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Properties
 *   description: Property management endpoints
 */

/**
 * @swagger
 * /api/properties:
 *   get:
 *     summary: Get all properties (public, paginated)
 *     tags: [Properties]
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
 *           default: 12
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: "createdAt:desc"
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *       - in: query
 *         name: propertyType
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: amenities
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of properties
 */
router.get("/", getAllProperties);

/**
 * @swagger
 * /api/properties/{id}:
 *   get:
 *     summary: Get a property by ID
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Property details
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Property not found
 */
router.get("/:id", validateObjectId("id"), getPropertyById);

/**
 * @swagger
 * /api/properties:
 *   post:
 *     summary: Create a new property (admin only)
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Property created
 */
router.post(
  "/",
  protect,
  authorize("admin"),
  upload.array("files"),
  createProperty,
);

/**
 * @swagger
 * /api/properties/{id}:
 *   patch:
 *     summary: Update property fields (admin only, whitelisted fields)
 *     tags: [Properties]
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
 *         description: Property updated
 */
router.patch("/:id", protect, authorize("admin"), validateObjectId("id"), updateProperty);

/**
 * @swagger
 * /api/properties/{id}:
 *   delete:
 *     summary: Delete a property (admin only)
 *     tags: [Properties]
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
 *         description: Property deleted
 */
router.delete("/:id", protect, authorize("admin"), validateObjectId("id"), deleteProperty);

export default router;
