import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Book from "@/models/Book";
import mongoose from "mongoose";
import fs from "fs/promises";
import path from "path";

const USE_LOCAL_STORAGE = process.env.STORAGE_TYPE !== "gcs";

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

    if (book.type !== "ebook") {
      return NextResponse.json(
        { error: "This is not an ebook" },
        { status: 400 }
      );
    }

    if (USE_LOCAL_STORAGE) {
      // Handle both formats: "books/xxx.epub" and "xxx.epub"
      let relativePath = book.filePath;
      if (!relativePath.startsWith("books/")) {
        relativePath = `books/${relativePath}`;
      }
      
      const filePath = path.join(
        process.cwd(),
        "public",
        "uploads",
        relativePath
      );

      console.log("[DEBUG] Book filePath from DB:", book.filePath);
      console.log("[DEBUG] Full file path:", filePath);

      try {
        const fileBuffer = await fs.readFile(filePath);
        
        return new NextResponse(fileBuffer, {
          headers: {
            "Content-Type": "application/epub+zip",
            "Content-Disposition": `inline; filename="${encodeURIComponent(book.title)}.epub"`,
            "Cache-Control": "private, max-age=3600",
          },
        });
      } catch {
        return NextResponse.json(
          { error: "File not found on server" },
          { status: 404 }
        );
      }
    } else {
      // For GCS, redirect to signed URL
      const { generateSignedUrl } = await import("@/lib/storage");
      const signedUrl = await generateSignedUrl(book.filePath, 60);
      return NextResponse.redirect(signedUrl);
    }
  } catch (error) {
    console.error("Error serving book file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
