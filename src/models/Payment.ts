import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  paystackReference: string;
  status: "pending" | "success" | "failed";
  amount: number;
}

const paymentSchema: Schema<IPayment> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    paystackReference: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      required: true,
    },
    amount: { type: Number, required: true },
  },
  { timestamps: true }
);

const Payment: Model<IPayment> = mongoose.model<IPayment>(
  "Payment",
  paymentSchema
);
export default Payment;