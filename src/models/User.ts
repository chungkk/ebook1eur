import mongoose, { Schema, Model } from "mongoose";
import type { IUser } from "@/types";

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    passwordHash: {
      type: String,
      required: [true, "Password is required"],
      minlength: [60, "Invalid password hash"],
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [1, "Name must be at least 1 character"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active",
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
