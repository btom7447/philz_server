import { Router } from "express";
import { loginSuperAdmin } from "../controllers/authController";
import { publicLimiter } from "../middleware/rateLimiter";

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Super admin authentication
 */

const router = Router();

/**
 * @swagger
 * /api/auth/super-admin/login:
 *   post:
 *     summary: Login as super admin
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post("/super-admin/login", publicLimiter, loginSuperAdmin);

export default router;