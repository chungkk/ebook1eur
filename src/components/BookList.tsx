"use client";

import { useState, useEffect } from "react";
import BookCard from "./BookCard";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { BookType } from "@/types";

interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  type: BookType;
  price: number;
  coverImage: string;
  duration?: number;
}

interface BookListProps {
  initialBooks?: Book[];
  type?: BookType;
  limit?: number;
  showLoadMore?: boolean;
}

export default function BookList({
  initialBooks = [],
  type,
  limit = 20,
  showLoadMore = true,
}: BookListProps) {
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBooks = async (pageNum: number, append = false) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: limit.toString(),
      });

      if (type) {
        params.set("type", type);
      }

      const response = await fetch(`/api/books?${params}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch books");
      }

      const newBooks = data.data.books;
      setBooks(append ? [...books, ...newBooks] : newBooks);
      setHasMore(pageNum < data.data.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialBooks.length === 0) {
      fetchBooks(1);
    }
  }, [type]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchBooks(nextPage, true);
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => fetchBooks(1)}
        >
          Thử lại
        </Button>
      </div>
    );
  }

  if (books.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        <p className="text-ink-500">Chưa có sách nào</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {books.map((book) => (
          <BookCard
            key={book.id}
            id={book.id}
            title={book.title}
            author={book.author}
            description={book.description}
            type={book.type}
            price={book.price}
            coverImage={book.coverImage}
            duration={book.duration}
          />
        ))}
      </div>

      {showLoadMore && hasMore && (
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang tải...
              </>
            ) : (
              "Xem thêm"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
