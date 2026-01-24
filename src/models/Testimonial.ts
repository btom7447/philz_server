import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITestimonial extends Document {
  name: string;
  title: string;
  content: string;
  rating: number;
  images: {
    url: string;
    public_id: string;
  }[];
  approved: boolean;
  isDeleted: boolean;
}

const testimonialSchema: Schema<ITestimonial> = new Schema(
  {
    name: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],
    approved: { type: Boolean, default: false, index: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Testimonial: Model<ITestimonial> = mongoose.model<ITestimonial>(
  "Testimonial",
  testimonialSchema,
);

export default Testimonial;