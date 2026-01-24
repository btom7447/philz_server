import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProperty extends Document {
  title: string;
  description: string;
  propertyType: "apartment" | "house" | "office" | "shop";
  address: { city: string; state: string };
  location: { type: "Point"; coordinates: [number, number] }; // [lng, lat]
  bedrooms: number;
  bathrooms: number;
  toilets: number;
  area: number; // sq ft
  garages: number;
  price: number;
  status: "for sale" | "for rent";
  featured: boolean;
  sold: boolean;
  yearBuilt: number;
  amenities: string[];
  images: {
    url: string;
    public_id: string;
  }[];

  videos: {
    url: string;
    public_id: string;
  }[];

  floorPlans: {
    url: string;
    public_id: string;
  }[];
  additionalDetails: Record<string, any>;
  createdBy: mongoose.Types.ObjectId;
}

const propertySchema: Schema<IProperty> = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    propertyType: {
      type: String,
      enum: ["apartment", "house", "office", "shop"],
      required: true,
    },
    address: {
      city: { type: String, required: true },
      state: { type: String, required: true },
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
      },
    },
    bedrooms: { type: Number, required: true },
    bathrooms: { type: Number, required: true },
    toilets: { type: Number, required: true },
    area: { type: Number, required: true },
    garages: { type: Number, required: true },
    price: { type: Number, required: true },
    status: { type: String, enum: ["for sale", "for rent"], required: true },
    featured: { type: Boolean, default: false },
    sold: { type: Boolean, default: false },
    yearBuilt: { type: Number, required: true },
    amenities: [{ type: String }],
    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],
    videos: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],
    floorPlans: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],
    additionalDetails: { type: Schema.Types.Mixed },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

// Geo index for fast distance queries
propertySchema.index({ location: "2dsphere" });

// Full-text index for search on title + description
propertySchema.index({ title: "text", description: "text" });

// Compound index for filtering & sorting
propertySchema.index({ "address.state": 1, status: 1, featured: -1, price: 1 });

const Property: Model<IProperty> = mongoose.model<IProperty>(
  "Property",
  propertySchema
);

export default Property;