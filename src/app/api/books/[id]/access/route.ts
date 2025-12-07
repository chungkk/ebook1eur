import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Book from "@/models/Book";
import Purchase from "@/models/Purchase";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid book ID" }, { status: 400 });
  }

  try {
    await connectDB();
    
    const book = await Book.findOne({ _id: id, status: "active" });
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const session = await auth();
    
    // Check if user has purchased this book
    let hasPurchased = false;
    if (session?.user?.id) {
      const purchase = await Purchase.findOne({
        userId: session.user.id,
        bookId: id,
        paymentStatus: "completed",
      });
      hasPurchased = !!purchase;
    }

    return NextResponse.json({
      success: true,
      data: {
        bookId: id,
        hasPurchased,
        isLoggedIn: !!session?.user,
        trialPages: 12, // Number of pages allowed for trial
      },
    });
  } catch (error) {
    console.error("Error checking book access:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
