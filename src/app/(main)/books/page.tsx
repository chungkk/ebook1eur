import { Suspense } from "react";
import { BookOpen, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import BookList from "@/components/BookList";
import { connectDB } from "@/lib/db";
import Book from "@/models/Book";
import Link from "next/link";
import type { BookType } from "@/types";

interface PageProps {
  searchParams: Promise<{ type?: string; page?: string }>;
}

async function getBooks(type?: string) {
  try {
    await connectDB();

    const query: Record<string, unknown> = { status: "active" };
    if (type === "ebook" || type === "audiobook") {
      query.type = type;
    }

    const books = await Book.find(query)
      .select("title description author type duration price coverImage")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return books.map((book) => ({
      id: book._id.toString(),
      title: book.title,
      description: book.description,
      author: book.author,
      type: book.type as BookType,
      duration: book.duration,
      price: book.price,
      coverImage: book.coverImage,
    }));
  } catch {
    return [];
  }
}

export default async function BooksPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const type = params.type;
  const books = await getBooks(type);

  const title =
    type === "ebook"
      ? "Ebook"
      : type === "audiobook"
        ? "Sách nói"
        : "Tất cả sách";

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-leather-800 mb-4">{title}</h1>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            <Link href="/books">
              <Button
                variant={!type ? "default" : "outline"}
                size="sm"
              >
                Tất cả
              </Button>
            </Link>
            <Link href="/books?type=ebook">
              <Button
                variant={type === "ebook" ? "default" : "outline"}
                size="sm"
              >
                <BookOpen className="mr-1 h-4 w-4" />
                Ebook
              </Button>
            </Link>
            <Link href="/books?type=audiobook">
              <Button
                variant={type === "audiobook" ? "default" : "outline"}
                size="sm"
              >
                <Headphones className="mr-1 h-4 w-4" />
                Sách nói
              </Button>
            </Link>
          </div>
        </div>

        {/* Book List */}
        <Suspense
          fallback={
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-parchment-100 rounded-xl aspect-[3/5]"
                />
              ))}
            </div>
          }
        >
          <BookList
            initialBooks={books}
            type={type as BookType | undefined}
          />
        </Suspense>
      </div>
    </div>
  );
}
