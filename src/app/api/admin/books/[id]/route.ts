import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Book from "@/models/Book";
import mongoose from "mongoose";
import { z } from "zod";

const updateBookSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  author: z.string().min(1).max(100).optional(),
  type: z.enum(["ebook", "audiobook"]).optional(),
  price: z.number().min(0.01).max(1000).optional(),
  duration: z.number().optional(),
  coverImage: z.string().url().optional(),
  filePath: z.string().min(1).optional(),
  fileSize: z.number().min(1).optional(),
  status: z.enum(["active", "deleted"]).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid book ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const book = await Book.findById(id).lean();

    if (!book) {
      return NextResponse.json(
        { success: false, error: "Book not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: book._id.toString(),
        title: book.title,
        description: book.description,
        author: book.author,
        type: book.type,
        price: book.price,
        duration: book.duration,
        coverImage: book.coverImage,
        filePath: book.filePath,
        fileSize: book.fileSize,
        status: book.status,
        createdAt: book.createdAt,
        updatedAt: book.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching book:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch book" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid book ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = updateBookSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "Invalid data";
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      );
    }

    await connectDB();

    const book = await Book.findByIdAndUpdate(
      id,
      { $set: validation.data },
      { new: true }
    );

    if (!book) {
      return NextResponse.json(
        { success: false, error: "Book not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: book._id.toString(),
        title: book.title,
      },
    });
  } catch (error) {
    console.error("Error updating book:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update book" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid book ID" },
        { status: 400 }
      );
    }

    await connectDB();

    // Soft delete
    const book = await Book.findByIdAndUpdate(
      id,
      { $set: { status: "deleted" } },
      { new: true }
    );

    if (!book) {
      return NextResponse.json(
        { success: false, error: "Book not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Book deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting book:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete book" },
      { status: 500 }
    );
  }
}
