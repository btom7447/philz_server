"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const rateLimiter_1 = require("../middleware/rateLimiter");
const validateRequest_1 = require("../middleware/validateRequest");
const validatorSchemas_1 = require("../utils/validatorSchemas");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
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
router.post("/register", rateLimiter_1.publicLimiter, (0, validateRequest_1.validateRequest)(validatorSchemas_1.registerSchema), authController_1.register);
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
router.post("/login", rateLimiter_1.authLimiter, (0, validateRequest_1.validateRequest)(validatorSchemas_1.loginSchema), authController_1.login);
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
router.get("/me", auth_1.protect, authController_1.getCurrentUser);
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
router.get("/session", authController_1.getSession);
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
router.post("/forgot-password", rateLimiter_1.passwordResetLimiter, (0, validateRequest_1.validateRequest)(validatorSchemas_1.forgotPasswordSchema), authController_1.forgotPassword);
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
router.post("/reset-password", rateLimiter_1.passwordResetLimiter, (0, validateRequest_1.validateRequest)(validatorSchemas_1.resetPasswordSchema), authController_1.resetPassword);
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
router.post("/verify-email", rateLimiter_1.publicLimiter, authController_1.verifyEmail);
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
router.post("/refresh", auth_1.protect, authController_1.refreshToken);
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
router.put("/update-profile", auth_1.protect, authController_1.updateProfile);
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
router.post("/logout", authController_1.logout);
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
router.delete("/delete-account", auth_1.protect, authController_1.deleteAccount);
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
router.get("/admin/pending", auth_1.protect, (0, auth_1.authorize)("admin"), authController_1.getPendingAdmins);
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
router.post("/admin/approve", auth_1.protect, (0, auth_1.authorize)("admin"), authController_1.approveAdmin);
exports.default = router;
