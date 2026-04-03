import { Router } from "express";
import {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  updateProfile,
  verifyEmail,
  approveAdmin,
  getPendingAdmins,
  refreshToken,
  deleteAccount,
  getSession,
} from "../controllers/authController";
import { authLimiter, passwordResetLimiter, publicLimiter } from "../middleware/rateLimiter";
import { validateRequest } from "../middleware/validateRequest";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../utils/validatorSchemas";
import { protect, authorize } from "../middleware/auth";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or user exists
 */
router.post(
  "/register",
  publicLimiter,
  validateRequest(registerSchema),
  register,
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login an existing user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               rememberMe:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Admin pending approval
 */
router.post("/login", authLimiter, validateRequest(loginSchema), login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 */
router.get("/me", protect, getCurrentUser);

/**
 * @swagger
 * /api/auth/session:
 *   get:
 *     summary: Check session status from cookie
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Session is valid
 *       401:
 *         description: No valid session
 */
router.get("/session", getSession);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request a password reset email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       404:
 *         description: User not found
 */
router.post(
  "/forgot-password",
  passwordResetLimiter,
  validateRequest(forgotPasswordSchema),
  forgotPassword,
);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset user password with token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Token invalid or expired
 */
router.post(
  "/reset-password",
  passwordResetLimiter,
  validateRequest(resetPasswordSchema),
  resetPassword,
);

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify user email address
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified
 */
router.post("/verify-email", publicLimiter, verifyEmail);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh the JWT token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: New token issued
 */
router.post("/refresh", protect, refreshToken);

/**
 * @swagger
 * /api/auth/update-profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put("/update-profile", protect, updateProfile);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout and revoke token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post("/logout", logout);

/**
 * @swagger
 * /api/auth/delete-account:
 *   delete:
 *     summary: Soft-delete user account and related data
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted
 */
router.delete("/delete-account", protect, deleteAccount);

// ---- Admin-only routes ----

/**
 * @swagger
 * /api/auth/admin/pending:
 *   get:
 *     summary: Get pending admin approval requests
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending admin users
 */
router.get("/admin/pending", protect, authorize("admin"), getPendingAdmins);

/**
 * @swagger
 * /api/auth/admin/approve:
 *   post:
 *     summary: Approve or deny admin access
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               approved:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Admin approval status updated
 */
router.post("/admin/approve", protect, authorize("admin"), approveAdmin);

export default router;
