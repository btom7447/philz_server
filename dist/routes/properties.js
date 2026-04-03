"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const propertyController_1 = require("../controllers/propertyController");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const validateObjectId_1 = require("../middleware/validateObjectId");
const router = (0, express_1.Router)();
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
router.get("/", propertyController_1.getAllProperties);
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
router.get("/:id", (0, validateObjectId_1.validateObjectId)("id"), propertyController_1.getPropertyById);
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
router.post("/", auth_1.protect, (0, auth_1.authorize)("admin"), upload_1.upload.array("files"), propertyController_1.createProperty);
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
router.patch("/:id", auth_1.protect, (0, auth_1.authorize)("admin"), (0, validateObjectId_1.validateObjectId)("id"), propertyController_1.updateProperty);
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
router.delete("/:id", auth_1.protect, (0, auth_1.authorize)("admin"), (0, validateObjectId_1.validateObjectId)("id"), propertyController_1.deleteProperty);
exports.default = router;
