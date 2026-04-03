import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITokenBlacklist extends Document {
  token: string;
  expiresAt: Date;
}

const tokenBlacklistSchema: Schema<ITokenBlacklist> = new Schema({
  token: { type: String, required: true, unique: true, index: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL index: auto-delete when expired
});

const TokenBlacklist: Model<ITokenBlacklist> = mongoose.model<ITokenBlacklist>(
  "TokenBlacklist",
  tokenBlacklistSchema,
);

export default TokenBlacklist;
