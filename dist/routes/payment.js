"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paymentController_1 = require("../controllers/paymentController");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const express_2 = __importDefault(require("express"));
/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment processing via Paystack
 */
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Initialize a payment (redirect to Paystack)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               propertyId:
 *                 type: string
 *               amount:
 *                 type: number
 *               idempotencyKey:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment initialized with Paystack URL
 */
router.post("/", auth_1.protect, (0, auth_1.authorize)("user"), paymentController_1.initPayment);
/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Paystack webhook (signature-verified)
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post("/webhook", rateLimiter_1.webhookLimiter, express_2.default.raw({ type: "application/json" }), paymentController_1.handleWebhook);
exports.default = router;
