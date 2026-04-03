import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAuditLog extends Document {
  userId: mongoose.Types.ObjectId;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ip?: string;
}

const auditLogSchema: Schema<IAuditLog> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true }, // e.g. "create", "update", "delete", "login", "approve"
    resource: { type: String, required: true }, // e.g. "property", "tour", "user"
    resourceId: { type: String },
    details: { type: Schema.Types.Mixed },
    ip: { type: String },
  },
  { timestamps: true },
);

auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, action: 1, createdAt: -1 });

const AuditLog: Model<IAuditLog> = mongoose.model<IAuditLog>(
  "AuditLog",
  auditLogSchema,
);

export default AuditLog;
