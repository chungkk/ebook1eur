"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  Headphones,
  Edit,
  Trash2,
  Loader2,
  Search,
  Plus,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";

interface Book {
  id: string;
  title: string;
  author: string;
  type: "ebook" | "audiobook";
  price: number;
  coverImage: string;
  status: "active" | "deleted";
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminBookList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [books, setBooks] = useState<Book[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [type, setType] = useState(searchParams.get("type") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "active");

  useEffect(() => {
    fetchBooks();
  }, [searchParams]);

  const fetchBooks = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchParams.get("search")) params.set("search", searchParams.get("search")!);
    if (searchParams.get("type")) params.set("type", searchParams.get("type")!);
    if (searchParams.get("status")) params.set("status", searchParams.get("status")!);
    if (searchParams.get("page")) params.set("page", searchParams.get("page")!);

    try {
      const response = await fetch(`/api/admin/books?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setBooks(data.data.books);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch books:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (type) params.set("type", type);
    if (status) params.set("status", status);
    router.push(`/admin/books?${params.toString()}`);
  };

  const handleDelete = async (book: Book) => {
    if (!confirm(`Bạn có chắc muốn xóa "${book.title}"?`)) return;

    setDeleting(book.id);
    try {
      const response = await fetch(`/api/admin/books/${book.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        fetchBooks();
      }
    } catch (error) {
      console.error("Failed to delete book:", error);
    } finally {
      setDeleting(null);
    }
  };

  const handleRestore = async (book: Book) => {
    try {
      const response = await fetch(`/api/admin/books/${book.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });
      const data = await response.json();

      if (data.success) {
        fetchBooks();
      }
    } catch (error) {
      console.error("Failed to restore book:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <Input
              placeholder="Tìm theo tên sách hoặc tác giả..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="h-10 px-3 rounded-md border border-parchment-300 bg-white"
          >
            <option value="">Tất cả loại</option>
            <option value="ebook">Ebook</option>
            <option value="audiobook">Sách nói</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 px-3 rounded-md border border-parchment-300 bg-white"
          >
            <option value="active">Đang hoạt động</option>
            <option value="deleted">Đã xóa</option>
          </select>
          <Button type="submit">Tìm</Button>
        </form>

        <Link href="/admin/books/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Thêm sách
          </Button>
        </Link>
      </div>

      {/* Book List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-leather-600" />
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-12 text-ink-500">
          Không tìm thấy sách nào
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-parchment-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-parchment-50 border-b border-parchment-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-ink-600">
                  Sách
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-ink-600">
                  Loại
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-ink-600">
                  Giá
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-ink-600">
                  Ngày tạo
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-ink-600">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-parchment-100">
              {books.map((book) => (
                <tr
                  key={book.id}
                  className={book.status === "deleted" ? "bg-red-50/50" : ""}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-14 rounded overflow-hidden bg-parchment-100 flex-shrink-0">
                        <Image
                          src={book.coverImage}
                          alt={book.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-leather-800 truncate">
                          {book.title}
                        </p>
                        <p className="text-sm text-ink-500 truncate">
                          {book.author}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                        book.type === "audiobook"
                          ? "bg-bookmark-blue/10 text-bookmark-blue"
                          : "bg-bookmark-green/10 text-bookmark-green"
                      }`}
                    >
                      {book.type === "audiobook" ? (
                        <Headphones className="h-3 w-3" />
                      ) : (
                        <BookOpen className="h-3 w-3" />
                      )}
                      {book.type === "audiobook" ? "Sách nói" : "Ebook"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{formatPrice(book.price)}</td>
                  <td className="px-4 py-3 text-sm text-ink-500">
                    {new Date(book.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {book.status === "active" ? (
                        <>
                          <Link href={`/admin/books/${book.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(book)}
                            disabled={deleting === book.id}
                          >
                            {deleting === book.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-red-500" />
                            )}
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(book)}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Khôi phục
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
            (page) => (
              <Button
                key={page}
                variant={pagination.page === page ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("page", page.toString());
                  router.push(`/admin/books?${params.toString()}`);
                }}
              >
                {page}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
}
