import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProperty extends Document {
  title: string;
  description: string;
  images: string[];
  price: number;
  location: string;
  status: "available" | "sold";
  createdBy: mongoose.Types.ObjectId;
}

const propertySchema: Schema<IProperty> = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    images: [{ type: String }],
    price: { type: Number, required: true },
    location: { type: String, required: true },
    status: { type: String, enum: ["available", "sold"], default: "available" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const Property: Model<IProperty> = mongoose.model<IProperty>(
  "Property",
  propertySchema
);
export default Property;