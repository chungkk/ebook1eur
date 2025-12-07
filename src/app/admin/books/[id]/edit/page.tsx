import { notFound } from "next/navigation";
import { Metadata } from "next";
import { connectDB } from "@/lib/db";
import Book from "@/models/Book";
import BookForm from "@/components/admin/BookForm";
import mongoose from "mongoose";

export const metadata: Metadata = {
  title: "Chỉnh sửa sách | Admin | ebook1eur",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getBook(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  await connectDB();
  const book = await Book.findById(id).lean();

  if (!book) return null;

  return {
    id: book._id.toString(),
    title: book.title,
    description: book.description,
    author: book.author,
    type: book.type as "ebook" | "audiobook",
    price: book.price,
    duration: book.duration,
    coverImage: book.coverImage,
    filePath: book.filePath,
    fileSize: book.fileSize,
  };
}

export default async function EditBookPage({ params }: PageProps) {
  const { id } = await params;
  const book = await getBook(id);

  if (!book) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-leather-800">
        Chỉnh sửa: {book.title}
      </h1>
      <BookForm book={book} mode="edit" />
    </div>
  );
}
