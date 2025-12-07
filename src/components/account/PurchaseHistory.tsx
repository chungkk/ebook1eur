"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Download, BookOpen, Headphones, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

interface Purchase {
  id: string;
  book: {
    id: string;
    title: string;
    author: string;
    type: "ebook" | "audiobook";
    coverImage: string;
    price: number;
  } | null;
  amount: number;
  paymentMethod: string;
  purchaseMonth: string;
  createdAt: string;
  download: {
    token: string;
    status: string;
    expiresAt: string;
    canDownload: boolean;
  } | null;
}

interface PurchaseHistoryProps {
  limit?: number;
  showViewAll?: boolean;
}

export default function PurchaseHistory({
  limit,
  showViewAll = false,
}: PurchaseHistoryProps) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetchPurchases();
  }, [limit]);

  const fetchPurchases = async () => {
    try {
      const response = await fetch(
        `/api/user/purchases?limit=${limit || 10}`
      );
      const data = await response.json();

      if (!data.success) {
        setError(data.error);
        return;
      }

      setPurchases(data.data.purchases);
    } catch {
      setError("Kaufhistorie konnte nicht geladen werden");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (purchase: Purchase) => {
    if (!purchase.download?.canDownload) return;

    setDownloading(purchase.id);

    try {
      const response = await fetch(`/api/download/${purchase.download.token}`);
      const data = await response.json();

      if (data.success) {
        window.open(data.data.downloadUrl, "_blank");

        // Mark as complete
        await fetch(`/api/download/${purchase.download.token}/complete`, {
          method: "POST",
        });

        // Refresh purchases
        fetchPurchases();
      }
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-leather-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <AlertCircle className="h-5 w-5" />
        <p>{error}</p>
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <div className="text-center py-8">
        <BookOpen className="h-12 w-12 mx-auto text-ink-300 mb-4" />
        <p className="text-ink-600">Sie haben noch keine Bücher gekauft</p>
        <Link href="/books">
          <Button className="mt-4">Bücher entdecken</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {purchases.map((purchase) => (
        <div
          key={purchase.id}
          className="flex gap-4 p-4 bg-white rounded-lg border border-parchment-200"
        >
          {/* Book Cover */}
          <div className="relative w-16 h-20 flex-shrink-0 rounded overflow-hidden bg-parchment-100">
            {purchase.book?.coverImage && (
              <Image
                src={purchase.book.coverImage}
                alt={purchase.book.title || "Book cover"}
                fill
                className="object-cover"
              />
            )}
          </div>

          {/* Book Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-medium text-leather-800 truncate">
                  {purchase.book?.title || "Buch gelöscht"}
                </h3>
                <p className="text-sm text-ink-500">
                  {purchase.book?.author}
                </p>
              </div>
              <span
                className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                  purchase.book?.type === "audiobook"
                    ? "bg-bookmark-blue/10 text-bookmark-blue"
                    : "bg-bookmark-green/10 text-bookmark-green"
                }`}
              >
                {purchase.book?.type === "audiobook" ? (
                  <Headphones className="h-3 w-3" />
                ) : (
                  <BookOpen className="h-3 w-3" />
                )}
                {purchase.book?.type === "audiobook" ? "Hörbuch" : "E-Book"}
              </span>
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="text-sm text-ink-500">
                <span>{formatPrice(purchase.amount)}</span>
                <span className="mx-2">•</span>
                <span>
                  {new Date(purchase.createdAt).toLocaleDateString("de-DE")}
                </span>
              </div>

              {purchase.download?.canDownload && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(purchase)}
                  disabled={downloading === purchase.id}
                >
                  {downloading === purchase.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-1" />
                      Herunterladen
                    </>
                  )}
                </Button>
              )}

              {purchase.download && !purchase.download.canDownload && (
                <span className="text-xs text-ink-400">Heruntergeladen</span>
              )}
            </div>
          </div>
        </div>
      ))}

      {showViewAll && purchases.length > 0 && (
        <Link href="/account/purchases" className="block">
          <Button variant="outline" className="w-full">
            Gesamte Kaufhistorie anzeigen
          </Button>
        </Link>
      )}
    </div>
  );
}
