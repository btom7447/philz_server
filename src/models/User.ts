import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcrypt";

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: "admin" | "user";
  adminApproved: boolean;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpire?: number;
  avatarUrl?: string;
  isDeleted: boolean;
  resetPasswordToken?: string;
  resetPasswordExpire?: number;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: false },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    adminApproved: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationExpire: { type: Number },
    avatarUrl: { type: String, default: "" },
    isDeleted: { type: Boolean, default: false },
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Number },
  },
  { timestamps: true },
);

// Pre-save hook to hash password
userSchema.pre<IUser>("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Exclude soft-deleted users from queries by default
userSchema.pre("find", function () {
  this.where({ isDeleted: { $ne: true } });
});
userSchema.pre("findOne", function () {
  this.where({ isDeleted: { $ne: true } });
});
userSchema.pre("countDocuments", function () {
  this.where({ isDeleted: { $ne: true } });
});

// Compare password
userSchema.methods.comparePassword = async function (
  candidatePassword: string,
) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);
export default User;
