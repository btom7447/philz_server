import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITourRequest extends Document {
  propertyId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: "virtual" | "in-person";
  status: "pending" | "approved" | "rejected" | "canceled";
  tourTime: Date;
  requestedAt: Date;
  approvedBy?: mongoose.Types.ObjectId;
  rescheduled?: boolean;
  meetLink?: string;
}

const tourRequestSchema: Schema<ITourRequest> = new Schema(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: { type: String, enum: ["virtual", "in-person"], required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "canceled"],
      default: "pending",
      index: true,
    },
    tourTime: { type: Date, required: true, index: true },
    requestedAt: { type: Date, default: Date.now },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    rescheduled: { type: Boolean, default: false },
    meetLink: { type: String },
  },
  { timestamps: true },
);

// Compound index for common queries: user + status + tourTime
tourRequestSchema.index({ userId: 1, status: 1, tourTime: 1 });

const TourRequest: Model<ITourRequest> = mongoose.model<ITourRequest>(
  "TourRequest",
  tourRequestSchema
);
export default TourRequest;