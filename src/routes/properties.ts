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
 *     summary: Get all properties (public)
 *     tags: [Properties]
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
 *         description: Property ID
 *     responses:
 *       200:
 *         description: Property details
 *       404:
 *         description: Property not found
 */
router.get("/:id", getPropertyById);

/**
 * @swagger
 * /api/properties:
 *   post:
 *     summary: Create a new property (admin only)
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               propertyType:
 *                 type: string
 *                 enum: [apartment, house, office, shop]
 *               address:
 *                 type: object
 *                 properties:
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *               location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *               bedrooms:
 *                 type: integer
 *               bathrooms:
 *                 type: integer
 *               toilets:
 *                 type: integer
 *               area:
 *                 type: number
 *                 description: Size in sq ft
 *               garages:
 *                 type: integer
 *               price:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [for sale, for rent]
 *               featured:
 *                 type: boolean
 *               sold:
 *                 type: boolean
 *               yearBuilt:
 *                 type: integer
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *               additionalDetails:
 *                 type: object
 *                 description: Extra details like bedroom features, doors, windows, floors, etc.
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                 format: binary
 *                 description: Images, videos, or floor plans
 *     responses:
 *       201:
 *         description: Property created successfully
 *       400:
 *         description: Missing required fields
 */
router.post(
  "/",
  protect,
  authorize("admin"),
  upload.array("files"),
  createProperty
);

/**
 * @swagger
 * /api/properties/{id}:
 *   patch:
 *     summary: Update property fields (admin only)
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               featured:
 *                 type: boolean
 *               sold:
 *                 type: boolean
 *               status:
 *                 type: string
 *                 enum: [for sale, for rent]
 *     responses:
 *       200:
 *         description: Property updated
 *       404:
 *         description: Property not found
 */
router.patch("/:id", protect, authorize("admin"), updateProperty);

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
 *         description: Property ID
 *     responses:
 *       200:
 *         description: Property deleted successfully
 *       404:
 *         description: Property not found
 */
router.delete("/:id", protect, authorize("admin"), deleteProperty);

export default router;