"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Download, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const token = searchParams.get("token");

  const [downloadInfo, setDownloadInfo] = useState<{
    downloadUrl: string;
    fileName: string;
    token: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);

  const fetchDownloadInfo = async (downloadToken: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/download/${downloadToken}`);
      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Download-Informationen konnten nicht abgerufen werden");
        return;
      }

      setDownloadInfo(data.data);
    } catch {
      setError("Verbindung zum Server fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDownloadInfo(token);
    }
  }, [token]);

  const handleDownload = async () => {
    if (!downloadInfo) return;

    // Open download in new tab
    window.open(downloadInfo.downloadUrl, "_blank");

    // Mark as completed
    try {
      await fetch(`/api/download/${downloadInfo.token}/complete`, {
        method: "POST",
      });
      setDownloaded(true);
    } catch (err) {
      console.error("Failed to mark download as complete:", err);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-lg mx-auto px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <CheckCircle className="h-16 w-16 text-bookmark-green" />
            </div>
            <CardTitle className="text-2xl text-leather-800">
              Zahlung erfolgreich!
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <p className="text-center text-ink-600">
              Vielen Dank für Ihren Kauf. Sie können das Buch jetzt herunterladen.
            </p>

            {loading && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-leather-600" />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {downloadInfo && !downloaded && (
              <div className="space-y-4">
                <div className="p-4 bg-parchment-50 rounded-lg">
                  <p className="font-medium text-leather-800">
                    {downloadInfo.fileName}
                  </p>
                  <p className="text-sm text-ink-500 mt-1">
                    Der Download-Link läuft nach 24 Stunden oder nach erfolgreichem Download ab
                  </p>
                </div>

                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleDownload}
                >
                  <Download className="mr-2 h-5 w-5" />
                  Jetzt herunterladen
                </Button>
              </div>
            )}

            {downloaded && (
              <div className="text-center space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700">
                    Download gestartet. Überprüfen Sie Ihren Downloads-Ordner.
                  </p>
                </div>
                <p className="text-sm text-ink-500">
                  Hinweis: Der Download-Link wurde verwendet und kann nicht wiederverwendet werden.
                </p>
              </div>
            )}

            {!token && !sessionId && (
              <div className="text-center text-ink-500">
                <p>Ungültige Zahlungsinformationen.</p>
              </div>
            )}

            <div className="pt-4 border-t border-parchment-200">
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/account/purchases" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Kaufhistorie ansehen
                  </Button>
                </Link>
                <Link href="/books" className="flex-1">
                  <Button variant="ghost" className="w-full">
                    Weiter einkaufen
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-leather-600" />
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
