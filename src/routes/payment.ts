import { Router } from "express";
import { initPayment, handleWebhook } from "../controllers/paymentController";
import { protect, authorize } from "../middleware/auth";

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment processing
 */

const router = Router();

// Initialize payment (redirect to Paystack)
router.post("/", protect, authorize("client"), initPayment);

// Paystack webhook
router.post("/webhook", handleWebhook);

export default router;