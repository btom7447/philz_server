import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITestimonial extends Document {
  userId: mongoose.Types.ObjectId;
  content: string;
  approved: boolean;
}

const testimonialSchema: Schema<ITestimonial> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    approved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Testimonial: Model<ITestimonial> = mongoose.model<ITestimonial>(
  "Testimonial",
  testimonialSchema
);
export default Testimonial;