import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Book from "@/models/Book";
import { z } from "zod";

const createBookSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  author: z.string().min(1).max(100),
  type: z.enum(["ebook", "audiobook"]),
  price: z.number().min(0.01).max(1000),
  duration: z.number().optional(),
  coverImage: z.string().min(1),
  filePath: z.string().min(1),
  fileSize: z.number().min(1),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type");
    const status = searchParams.get("status") || "active";
    const search = searchParams.get("search");
    const skip = (page - 1) * limit;

    await connectDB();

    const query: Record<string, unknown> = {};

    if (type && ["ebook", "audiobook"].includes(type)) {
      query.type = type;
    }

    if (status && ["active", "deleted"].includes(status)) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
      ];
    }

    const [books, total] = await Promise.all([
      Book.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Book.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        books: books.map((book) => ({
          id: book._id.toString(),
          title: book.title,
          author: book.author,
          type: book.type,
          price: book.price,
          duration: book.duration,
          coverImage: book.coverImage,
          fileSize: book.fileSize,
          status: book.status,
          createdAt: book.createdAt,
          updatedAt: book.updatedAt,
        })),
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
      { success: false, error: "Failed to fetch books" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = createBookSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "Invalid data";
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      );
    }

    await connectDB();

    const book = await Book.create({
      ...validation.data,
      status: "active",
    });

    return NextResponse.json({
      success: true,
      data: {
        id: book._id.toString(),
        title: book.title,
      },
    });
  } catch (error) {
    console.error("Error creating book:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create book" },
      { status: 500 }
    );
  }
}
