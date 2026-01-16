"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleWebhook = exports.initPayment = void 0;
const Payment_1 = __importDefault(require("../models/Payment"));
const initPayment = async (req, res) => {
    // redirect URL to Paystack checkout will be handled on frontend
    const { propertyId, amount } = req.body;
    const payment = await Payment_1.default.create({
        propertyId,
        userId: req.user._id,
        paystackReference: "TEMP_REF", // frontend will generate
        status: "pending",
        amount,
    });
    res.status(201).json(payment);
};
exports.initPayment = initPayment;
// webhook endpoint
const handleWebhook = async (req, res) => {
    // verify Paystack signature and update payment status
    res.status(200).json({ message: "Webhook received" });
};
exports.handleWebhook = handleWebhook;
