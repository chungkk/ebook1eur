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

interface AccessInfo {
  hasPurchased: boolean;
  isLoggedIn: boolean;
  trialPages: number;
}

async function decryptWithToken(encryptedData: ArrayBuffer, token: string): Promise<ArrayBuffer> {
  // Decode the token to get key and iv
  const tokenBytes = Uint8Array.from(atob(token), c => c.charCodeAt(0));
  const keyBytes = tokenBytes.slice(0, 32);
  const iv = tokenBytes.slice(32, 48);
  
  // Import the key
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-CBC" },
    false,
    ["decrypt"]
  );
  
  // Decrypt the content
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-CBC", iv },
    key,
    encryptedData
  );
  
  return decrypted;
}

export default function ReadBookPage() {
  const params = useParams();
  const router = useRouter();
  const [book, setBook] = useState<BookInfo | null>(null);
  const [epubData, setEpubData] = useState<ArrayBuffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessInfo, setAccessInfo] = useState<AccessInfo>({
    hasPurchased: false,
    isLoggedIn: false,
    trialPages: 12,
  });

  const bookId = params.id as string;

  useEffect(() => {
    async function fetchBook() {
      try {
        // Fetch book info and access status in parallel
        const [bookRes, accessRes] = await Promise.all([
          fetch(`/api/books/${bookId}`),
          fetch(`/api/books/${bookId}/access`),
        ]);
        
        if (!bookRes.ok) {
          throw new Error("Book not found");
        }
        
        const bookJson = await bookRes.json();
        const bookData = bookJson.data || bookJson;
        
        if (bookData.type !== "ebook") {
          setError("Đây không phải là ebook");
          return;
        }
        
        setBook(bookData);
        
        // Get access info
        let hasPurchased = false;
        if (accessRes.ok) {
          const accessJson = await accessRes.json();
          setAccessInfo(accessJson.data);
          hasPurchased = accessJson.data?.hasPurchased || false;
        }
        
        // Fetch epub file - use trial mode if not purchased
        const mode = hasPurchased ? "full" : "trial";
        const fileRes = await fetch(`/api/books/${bookId}/file?mode=${mode}`);
        
        if (!fileRes.ok) {
          const errorData = await fileRes.json();
          if (errorData.requirePurchase) {
            setError("Bạn cần mua sách để đọc toàn bộ nội dung");
            return;
          }
          throw new Error("Failed to load book file");
        }
        
        // Check if content is encrypted and get the token
        const isEncrypted = fileRes.headers.get("X-Content-Encrypted") === "true";
        const encryptionToken = fileRes.headers.get("X-Encryption-Token");
        const arrayBuffer = await fileRes.arrayBuffer();
        
        // Decrypt if encrypted
        let finalData = arrayBuffer;
        if (isEncrypted && encryptionToken) {
          finalData = await decryptWithToken(arrayBuffer, encryptionToken);
        }
        setEpubData(finalData);
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
      bookId={bookId}
      isTrialMode={!accessInfo.hasPurchased}
      trialPages={accessInfo.trialPages}
      onClose={handleClose}
    />
  );
}
