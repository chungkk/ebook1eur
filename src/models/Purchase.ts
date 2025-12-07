import mongoose, { Schema, Model } from "mongoose";
import type { IPurchase } from "@/types";

const PurchaseSchema = new Schema<IPurchase>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    bookId: {
      type: Schema.Types.ObjectId,
      ref: "Book",
      required: [true, "Book ID is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    paymentMethod: {
      type: String,
      enum: ["stripe", "paypal"],
      required: [true, "Payment method is required"],
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    paymentId: {
      type: String,
      sparse: true,
    },
    purchaseMonth: {
      type: String,
      required: [true, "Purchase month is required"],
      match: [/^\d{4}-\d{2}$/, "Purchase month must be in YYYY-MM format"],
    },
  },
  {
    timestamps: true,
  }
);

PurchaseSchema.index({ userId: 1, createdAt: -1 });
PurchaseSchema.index({ userId: 1, purchaseMonth: 1, paymentStatus: 1 });
PurchaseSchema.index({ bookId: 1 });

const Purchase: Model<IPurchase> =
  mongoose.models.Purchase ||
  mongoose.model<IPurchase>("Purchase", PurchaseSchema);

export default Purchase;
