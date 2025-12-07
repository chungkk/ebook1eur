import mongoose, { Schema, Model } from "mongoose";
import type { IMonthlyQuota } from "@/types";

const MonthlyQuotaSchema = new Schema<IMonthlyQuota>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    month: {
      type: String,
      required: [true, "Month is required"],
      match: [/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"],
    },
    ebookCount: {
      type: Number,
      default: 0,
      min: [0, "Ebook count cannot be negative"],
      max: [2, "Ebook count cannot exceed 2"],
    },
    audiobookCount: {
      type: Number,
      default: 0,
      min: [0, "Audiobook count cannot be negative"],
      max: [2, "Audiobook count cannot exceed 2"],
    },
  },
  {
    timestamps: true,
  }
);

MonthlyQuotaSchema.index({ userId: 1, month: 1 }, { unique: true });

const MonthlyQuota: Model<IMonthlyQuota> =
  mongoose.models.MonthlyQuota ||
  mongoose.model<IMonthlyQuota>("MonthlyQuota", MonthlyQuotaSchema);

export default MonthlyQuota;
