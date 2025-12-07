import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Headphones, Clock, ArrowLeft, FileText, Play } from "lucide-react";
import { connectDB } from "@/lib/db";
import Book from "@/models/Book";
import { formatPrice, formatDuration } from "@/lib/utils";
import CheckoutButton from "@/components/CheckoutButton";
import QuotaDisplay from "@/components/QuotaDisplay";
import mongoose from "mongoose";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getBook(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  try {
    await connectDB();
    const book = await Book.findOne({ _id: id, status: "active" }).lean();
    if (!book) return null;

    return {
      id: book._id.toString(),
      title: book.title,
      description: book.description,
      author: book.author,
      type: book.type as "ebook" | "audiobook",
      duration: book.duration,
      price: book.price,
      coverImage: book.coverImage,
      fileSize: book.fileSize,
    };
  } catch {
    return null;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024)
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
}

export default async function BookDetailPage({ params }: PageProps) {
  const { id } = await params;
  const book = await getBook(id);

  if (!book) {
    notFound();
  }

  const isAudiobook = book.type === "audiobook";

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          href="/books"
          className="inline-flex items-center text-ink-600 hover:text-leather-700 mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zur Liste
        </Link>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Cover Image */}
          <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-parchment-100 shadow-lg">
            <Image
              src={book.coverImage}
              alt={book.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute top-4 right-4">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium ${
                  isAudiobook
                    ? "bg-bookmark-blue text-white"
                    : "bg-bookmark-green text-white"
                }`}
              >
                {isAudiobook ? (
                  <>
                    <Headphones className="h-4 w-4" />
                    Hörbuch
                  </>
                ) : (
                  <>
                    <BookOpen className="h-4 w-4" />
                    E-Book
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Book Info */}
          <div className="flex flex-col">
            <h1 className="text-3xl md:text-4xl font-bold text-leather-900 mb-2">
              {book.title}
            </h1>
            <p className="text-lg text-ink-600 mb-4">von {book.author}</p>

            {/* Meta Info */}
            <div className="flex flex-wrap gap-4 mb-6 text-sm text-ink-500">
              {isAudiobook && book.duration && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDuration(book.duration)}
                </div>
              )}
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {formatFileSize(book.fileSize)}
              </div>
            </div>

            {/* Price */}
            <div className="mb-6">
              <span className="text-4xl font-bold text-leather-700">
                {formatPrice(book.price)}
              </span>
            </div>

            {/* Quota Display */}
            <div className="mb-4">
              <QuotaDisplay compact />
            </div>

            {/* Read / Checkout Buttons */}
            <div className="mb-8 flex flex-col gap-3">
              {!isAudiobook && (
                <Link
                  href={`/books/${book.id}/read`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-bookmark-green px-6 py-3 text-lg font-semibold text-white hover:bg-green-600 transition-colors"
                >
                  <Play className="h-5 w-5" />
                  Đọc sách
                </Link>
              )}
              <CheckoutButton
                bookId={book.id}
                bookTitle={book.title}
                bookType={book.type}
                price={book.price}
              />
            </div>

            {/* Description */}
            <div className="prose prose-stone max-w-none">
              <h2 className="text-xl font-semibold text-leather-800 mb-3">
                Beschreibung
              </h2>
              <p className="text-ink-600 whitespace-pre-line leading-relaxed">
                {book.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
