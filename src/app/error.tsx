"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-cream-50">
      <div className="text-center max-w-md">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-leather-800 mb-2">
          Ein Fehler ist aufgetreten
        </h1>
        <p className="text-ink-600 mb-6">
          Entschuldigung, ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Erneut versuchen
          </Button>
          <Link href="/">
            <Button variant="outline">
              <Home className="mr-2 h-4 w-4" />
              Zur Startseite
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
