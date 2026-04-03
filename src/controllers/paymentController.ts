import crypto from "crypto";
import { Request, Response } from "express";
import Payment from "../models/Payment";
import AuditLog from "../models/AuditLog";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "";

// ============================
// INITIALIZE PAYMENT
// ============================
export const initPayment = async (req: Request, res: Response) => {
  try {
    const { propertyId, amount, idempotencyKey } = req.body;

    if (!propertyId || !amount) {
      return res.status(400).json({ message: "propertyId and amount are required" });
    }

    // Check idempotency — prevent duplicate payments
    if (idempotencyKey) {
      const existing = await Payment.findOne({ idempotencyKey });
      if (existing) {
        return res.status(200).json({
          message: "Payment already initiated",
          payment: existing,
        });
      }
    }

    // Initialize transaction with Paystack
    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: req.user!.email,
        amount: Math.round(amount * 100), // Paystack expects kobo
        metadata: {
          propertyId,
          userId: req.user!._id.toString(),
        },
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackData.status) {
      return res.status(400).json({
        message: "Failed to initialize payment",
        error: paystackData.message,
      });
    }

    const payment = await Payment.create({
      propertyId,
      userId: req.user!._id,
      paystackReference: paystackData.data.reference,
      paystackAccessCode: paystackData.data.access_code,
      paystackAuthorizationUrl: paystackData.data.authorization_url,
      status: "pending",
      amount,
      idempotencyKey,
    });

    await AuditLog.create({
      userId: req.user!._id,
      action: "create",
      resource: "payment",
      resourceId: payment._id.toString(),
      details: { amount, propertyId },
      ip: req.ip,
    });

    res.status(201).json({
      payment,
      authorizationUrl: paystackData.data.authorization_url,
    });
  } catch (err: any) {
    console.error("Init payment error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================
// PAYSTACK WEBHOOK
// ============================
export const handleWebhook = async (req: Request, res: Response) => {
  try {
    // Verify Paystack signature
    const signature = req.headers["x-paystack-signature"] as string;
    if (!signature) {
      return res.status(400).json({ message: "Missing signature" });
    }

    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== signature) {
      return res.status(401).json({ message: "Invalid signature" });
    }

    const event = req.body;

    if (event.event === "charge.success") {
      const { reference } = event.data;
      const payment = await Payment.findOne({ paystackReference: reference });

      if (payment && payment.status !== "success") {
        payment.status = "success";
        await payment.save();
      }
    }

    if (event.event === "charge.failed") {
      const { reference } = event.data;
      const payment = await Payment.findOne({ paystackReference: reference });

      if (payment && payment.status !== "failed") {
        payment.status = "failed";
        await payment.save();
      }
    }

    // Always return 200 to acknowledge receipt
    res.status(200).json({ message: "Webhook processed" });
  } catch (err: any) {
    console.error("Webhook error:", err);
    res.status(200).json({ message: "Webhook received" }); // Still 200 so Paystack doesn't retry
  }
};
