import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInquiry extends Document {
  name: string;
  email: string;
  message: string;
  propertyId?: mongoose.Types.ObjectId;
}

const inquirySchema: Schema<IInquiry> = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: "Property" },
  },
  { timestamps: true }
);

const Inquiry: Model<IInquiry> = mongoose.model<IInquiry>(
  "Inquiry",
  inquirySchema
);
export default Inquiry;