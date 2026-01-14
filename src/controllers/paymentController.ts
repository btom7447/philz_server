import { Request, Response } from "express";
import Payment from "../models/Payment";

export const initPayment = async (req: Request, res: Response) => {
  // redirect URL to Paystack checkout will be handled on frontend
  const { propertyId, amount } = req.body;
  const payment = await Payment.create({
    propertyId,
    userId: req.user!._id,
    paystackReference: "TEMP_REF", // frontend will generate
    status: "pending",
    amount,
  });
  res.status(201).json(payment);
};

// webhook endpoint
export const handleWebhook = async (req: Request, res: Response) => {
  // verify Paystack signature and update payment status
  res.status(200).json({ message: "Webhook received" });
};