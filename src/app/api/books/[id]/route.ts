import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Book from "@/models/Book";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "ID sách không hợp lệ" },
        { status: 400 }
      );
    }

    await connectDB();

    const book = await Book.findOne({
      _id: id,
      status: "active",
    }).lean();

    if (!book) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy sách" },
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
        duration: book.duration,
        price: book.price,
        coverImage: book.coverImage,
        fileSize: book.fileSize,
        createdAt: book.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching book:", error);
    return NextResponse.json(
      { success: false, error: "Không thể tải thông tin sách" },
      { status: 500 }
    );
  }
}
