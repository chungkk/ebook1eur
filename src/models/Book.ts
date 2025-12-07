import mongoose, { Schema, Model } from "mongoose";
import type { IBook } from "@/types";

const BookSchema = new Schema<IBook>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [1, "Title must be at least 1 character"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    author: {
      type: String,
      required: [true, "Author is required"],
      trim: true,
      minlength: [1, "Author must be at least 1 character"],
      maxlength: [100, "Author cannot exceed 100 characters"],
    },
    type: {
      type: String,
      enum: ["ebook", "audiobook"],
      required: [true, "Book type is required"],
    },
    duration: {
      type: Number,
      min: [1, "Duration must be at least 1 second"],
      validate: {
        validator: function (this: IBook, v: number | undefined) {
          if (this.type === "audiobook") {
            return v !== undefined && v > 0;
          }
          return true;
        },
        message: "Duration is required for audiobooks",
      },
    },
    price: {
      type: Number,
      required: true,
      default: 1.0,
      min: [0, "Price cannot be negative"],
    },
    coverImage: {
      type: String,
      required: [true, "Cover image is required"],
    },
    filePath: {
      type: String,
      required: [true, "File path is required"],
    },
    fileSize: {
      type: Number,
      required: [true, "File size is required"],
      max: [2147483648, "File size cannot exceed 2GB"],
    },
    status: {
      type: String,
      enum: ["active", "deleted"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

BookSchema.index({ type: 1, status: 1 });
BookSchema.index({ status: 1, createdAt: -1 });
BookSchema.index({ title: "text", author: "text" });

const Book: Model<IBook> =
  mongoose.models.Book || mongoose.model<IBook>("Book", BookSchema);

export default Book;
