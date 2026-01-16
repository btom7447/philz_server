"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paymentController_1 = require("../controllers/paymentController");
const auth_1 = require("../middleware/auth");
/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment processing
 */
const router = (0, express_1.Router)();
// Initialize payment (redirect to Paystack)
router.post("/", auth_1.protect, (0, auth_1.authorize)("client"), paymentController_1.initPayment);
// Paystack webhook
router.post("/webhook", paymentController_1.handleWebhook);
exports.default = router;
