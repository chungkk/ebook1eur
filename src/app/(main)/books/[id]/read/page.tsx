"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const EpubReader = dynamic(() => import("@/components/EpubReader"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  ),
});

interface BookInfo {
  id: string;
  title: string;
  type: string;
}

export default function ReadBookPage() {
  const params = useParams();
  const router = useRouter();
  const [book, setBook] = useState<BookInfo | null>(null);
  const [epubData, setEpubData] = useState<ArrayBuffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bookId = params.id as string;

  useEffect(() => {
    async function fetchBook() {
      try {
        // Fetch book info
        const res = await fetch(`/api/books/${bookId}`);
        if (!res.ok) {
          throw new Error("Book not found");
        }
        const json = await res.json();
        const data = json.data || json;
        
        if (data.type !== "ebook") {
          setError("Đây không phải là ebook");
          return;
        }
        
        setBook(data);
        
        // Fetch epub file as ArrayBuffer
        const fileRes = await fetch(`/api/books/${bookId}/file`);
        if (!fileRes.ok) {
          throw new Error("Failed to load book file");
        }
        const arrayBuffer = await fileRes.arrayBuffer();
        setEpubData(arrayBuffer);
      } catch (err) {
        console.error("Error loading book:", err);
        setError("Không tìm thấy sách hoặc không thể tải file");
      } finally {
        setLoading(false);
      }
    }

    if (bookId) {
      fetchBook();
    }
  }, [bookId]);

  const handleClose = () => {
    router.push(`/books/${bookId}`);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Đang tải sách...</span>
      </div>
    );
  }

  if (error || !book || !epubData) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white">
        <p className="text-red-500 mb-4">{error || "Không tìm thấy sách"}</p>
        <button
          onClick={() => router.push("/books")}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <EpubReader
      url={epubData}
      title={book.title}
      onClose={handleClose}
    />
  );
}
