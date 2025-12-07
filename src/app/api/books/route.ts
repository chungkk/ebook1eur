import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Book from "@/models/Book";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const search = searchParams.get("search");

    const query: Record<string, unknown> = { status: "active" };

    if (type && (type === "ebook" || type === "audiobook")) {
      query.type = type;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const skip = (page - 1) * limit;

    const [books, total] = await Promise.all([
      Book.find(query)
        .select("title description author type duration price coverImage createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Book.countDocuments(query),
    ]);

    const formattedBooks = books.map((book) => ({
      id: book._id.toString(),
      title: book.title,
      description: book.description,
      author: book.author,
      type: book.type,
      duration: book.duration,
      price: book.price,
      coverImage: book.coverImage,
    }));

    return NextResponse.json({
      success: true,
      data: {
        books: formattedBooks,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching books:", error);
    return NextResponse.json(
      { success: false, error: "Không thể tải danh sách sách" },
      { status: 500 }
    );
  }
}
