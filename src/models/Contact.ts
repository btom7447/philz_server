import mongoose, { Schema, Document, Model } from "mongoose";

export interface IContact extends Document {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  isDeleted: boolean;
}

const contactSchema: Schema<IContact> = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    subject: { type: String },
    message: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Contact: Model<IContact> = mongoose.model<IContact>(
  "Contact",
  contactSchema
);

export default Contact;