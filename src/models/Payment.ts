import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  paystackReference: string;
  paystackAccessCode?: string;
  paystackAuthorizationUrl?: string;
  status: "pending" | "success" | "failed";
  amount: number;
  idempotencyKey?: string;
  isDeleted: boolean;
}

const paymentSchema: Schema<IPayment> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    paystackReference: { type: String, required: true, unique: true },
    paystackAccessCode: { type: String },
    paystackAuthorizationUrl: { type: String },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      required: true,
    },
    amount: { type: Number, required: true },
    idempotencyKey: { type: String, unique: true, sparse: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Payment: Model<IPayment> = mongoose.model<IPayment>(
  "Payment",
  paymentSchema
);
export default Payment;