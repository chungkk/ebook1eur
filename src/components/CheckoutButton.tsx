"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2, Wrench } from "lucide-react";
import type { BookType } from "@/types";

interface CheckoutButtonProps {
  bookId: string;
  bookTitle: string;
  bookType: BookType;
  price: number;
}

export default function CheckoutButton({
  bookId,
  bookTitle,
  bookType,
  price,
}: CheckoutButtonProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<"stripe" | "paypal" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAudiobook = bookType === "audiobook";

  // Audiobooks are under maintenance
  if (isAudiobook) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center gap-2 text-orange-700 font-medium mb-2">
            <Wrench className="h-5 w-5" />
            Hörbücher in Wartung
          </div>
          <p className="text-sm text-orange-600">
            Der Kauf von Hörbüchern ist derzeit nicht verfügbar. Wir arbeiten daran, diesen Service bald wieder anzubieten.
          </p>
        </div>
      </div>
    );
  }

  const handleStripeCheckout = async () => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/books/${bookId}`);
      return;
    }

    setLoading("stripe");
    setError(null);

    try {
      const response = await fetch("/api/checkout/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Ein Fehler ist aufgetreten");
        return;
      }

      window.location.href = data.data.url;
    } catch {
      setError("Verbindung zum Server fehlgeschlagen");
    } finally {
      setLoading(null);
    }
  };

  const handlePayPalCheckout = async () => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/books/${bookId}`);
      return;
    }

    setLoading("paypal");
    setError(null);

    try {
      const response = await fetch("/api/checkout/paypal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Ein Fehler ist aufgetreten");
        return;
      }

      window.location.href = `https://www.sandbox.paypal.com/checkoutnow?token=${data.data.orderId}`;
    } catch {
      setError("Verbindung zum Server fehlgeschlagen");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          size="lg"
          className="flex-1"
          onClick={handleStripeCheckout}
          disabled={loading !== null}
        >
          {loading === "stripe" ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <CreditCard className="mr-2 h-5 w-5" />
          )}
          Mit Stripe bezahlen
        </Button>

        <Button
          size="lg"
          variant="outline"
          className="flex-1 bg-[#ffc439] hover:bg-[#f0b72f] text-[#003087] border-[#ffc439]"
          onClick={handlePayPalCheckout}
          disabled={loading !== null}
        >
          {loading === "paypal" ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <span className="font-bold">PayPal</span>
          )}
        </Button>
      </div>

      {status === "unauthenticated" && (
        <p className="text-sm text-ink-500 text-center">
          Bitte melden Sie sich an, um ein Buch zu kaufen
        </p>
      )}
    </div>
  );
}
