import { Router } from "express";
import { initPayment, handleWebhook } from "../controllers/paymentController";
import { protect, authorize } from "../middleware/auth";
import { webhookLimiter } from "../middleware/rateLimiter";
import express from "express";

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment processing via Paystack
 */

const router = Router();

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
router.post("/", protect, authorize("user"), initPayment);

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
router.post(
  "/webhook",
  webhookLimiter,
  express.raw({ type: "application/json" }),
  handleWebhook,
);

export default router;
