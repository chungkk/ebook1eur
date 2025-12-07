import mongoose, { Schema, Model } from "mongoose";
import type { IDownload } from "@/types";

const DownloadSchema = new Schema<IDownload>(
  {
    purchaseId: {
      type: Schema.Types.ObjectId,
      ref: "Purchase",
      required: [true, "Purchase ID is required"],
    },
    token: {
      type: String,
      required: [true, "Token is required"],
      minlength: [64, "Token must be 64 characters"],
      maxlength: [64, "Token must be 64 characters"],
    },
    status: {
      type: String,
      enum: ["active", "used", "expired"],
      default: "active",
    },
    expiresAt: {
      type: Date,
      required: [true, "Expiration date is required"],
    },
    usedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

DownloadSchema.index({ token: 1 }, { unique: true });
DownloadSchema.index({ purchaseId: 1 });
DownloadSchema.index({ status: 1, expiresAt: 1 });

const Download: Model<IDownload> =
  mongoose.models.Download ||
  mongoose.model<IDownload>("Download", DownloadSchema);

export default Download;
