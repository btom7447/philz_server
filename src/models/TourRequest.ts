import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITourRequest extends Document {
  propertyId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: "virtual" | "in-person";
  status: "pending" | "approved" | "rejected";
  requestedAt: Date;
  approvedBy?: mongoose.Types.ObjectId;
}

const tourRequestSchema: Schema<ITourRequest> = new Schema(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["virtual", "in-person"], required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    requestedAt: { type: Date, default: Date.now },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const TourRequest: Model<ITourRequest> = mongoose.model<ITourRequest>(
  "TourRequest",
  tourRequestSchema
);
export default TourRequest;