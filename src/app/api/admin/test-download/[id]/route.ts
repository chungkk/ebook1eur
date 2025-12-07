import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Book from "@/models/Book";
import { generateSignedUrl } from "@/lib/storage";
import mongoose from "mongoose";

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

    const book = await Book.findById(id);

    if (!book) {
      return NextResponse.json(
        { success: false, error: "Book not found" },
        { status: 404 }
      );
    }

    const downloadUrl = await generateSignedUrl(book.filePath, 60);

    return NextResponse.json({
      success: true,
      data: {
        downloadUrl,
        fileName: book.title,
        filePath: book.filePath,
      },
    });
  } catch (error) {
    console.error("Test download error:", error);
    return NextResponse.json(
      { success: false, error: "Download failed" },
      { status: 500 }
    );
  }
}
