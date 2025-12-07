"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Upload,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Clock,
  BookOpen,
} from "lucide-react";

type CrawlSourceId = "ebook-de" | "hugendubel";

interface CrawledBook {
  rank: number;
  title: string;
  author: string;
  url: string;
}

interface CrawlHistory {
  date: string;
  filename: string;
  totalBooks: number;
  source: string;
  sourceId: CrawlSourceId;
}

interface SourceInfo {
  name: string;
  url: string;
}

interface LatestCrawl {
  source: string;
  sourceId: CrawlSourceId;
  crawledAt: string;
  totalBooks: number;
  topBooks: CrawledBook[];
}

interface CrawlData {
  sources: Record<CrawlSourceId, SourceInfo>;
  latest: Record<CrawlSourceId, LatestCrawl | null>;
  history: CrawlHistory[];
}

const SOURCE_IDS: CrawlSourceId[] = ["ebook-de", "hugendubel"];

export default function CrawlPage() {
  const [data, setData] = useState<CrawlData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedSource, setSelectedSource] = useState<CrawlSourceId>("ebook-de");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/admin/crawl");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Error fetching crawl data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    try {
      const htmlContent = await file.text();

      const response = await fetch("/api/admin/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ htmlContent, sourceId: selectedSource }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({
          type: "success",
          text: `Erfolgreich ${result.data.totalBooks} Bücher von ${data?.sources[selectedSource]?.name || selectedSource} importiert!`,
        });
        fetchData();
      } else {
        setMessage({
          type: "error",
          text: result.error || "Fehler beim Import",
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage({
        type: "error",
        text: "Fehler beim Hochladen der Datei",
      });
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = "";
    }
  };

  const currentSourceData = data?.latest[selectedSource];
  const currentSourceInfo = data?.sources[selectedSource];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-leather-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-leather-800">
          Bestseller Crawler
        </h1>
        <Button
          variant="outline"
          onClick={fetchData}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Aktualisieren
        </Button>
      </div>

      {/* Source Tabs */}
      <div className="flex gap-2 border-b border-parchment-200">
        {SOURCE_IDS.map((sourceId) => (
          <button
            key={sourceId}
            onClick={() => setSelectedSource(sourceId)}
            className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px ${
              selectedSource === sourceId
                ? "border-leather-600 text-leather-800"
                : "border-transparent text-ink-500 hover:text-leather-600"
            }`}
          >
            {data?.sources[sourceId]?.name || sourceId}
          </button>
        ))}
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-2 ${
            message.type === "success"
              ? "bg-bookmark-green/10 text-bookmark-green"
              : "bg-bookmark-red/10 text-bookmark-red"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          {message.text}
        </div>
      )}

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Manuelle Datenaktualisierung - {currentSourceInfo?.name || selectedSource}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-parchment-100 p-4 rounded-lg">
            <h4 className="font-medium text-leather-800 mb-2">Anleitung:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-ink-600">
              <li>
                Öffnen Sie{" "}
                <a
                  href={currentSourceInfo?.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-bookmark-blue hover:underline inline-flex items-center gap-1"
                >
                  {currentSourceInfo?.name || selectedSource} Bestseller
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>Rechtsklick → &quot;Seitenquelltext anzeigen&quot; (Strg+U)</li>
              <li>Speichern Sie die HTML-Datei</li>
              <li>Laden Sie die Datei hier hoch</li>
            </ol>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex-1">
              <input
                type="file"
                accept=".html,.htm,.txt"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  uploading
                    ? "border-ink-300 bg-parchment-50"
                    : "border-leather-300 hover:border-leather-500 hover:bg-parchment-50"
                }`}
              >
                {uploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>Verarbeite...</span>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-8 w-8 mx-auto mb-2 text-leather-400" />
                    <p className="text-sm text-ink-600">
                      HTML-Datei für {currentSourceInfo?.name || selectedSource} hier ablegen
                    </p>
                  </div>
                )}
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Latest Crawl for Selected Source */}
      {currentSourceData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Aktuelle Daten - {currentSourceInfo?.name || selectedSource}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-parchment-50 p-3 rounded-lg">
                <p className="text-sm text-ink-500">Quelle</p>
                <p className="font-medium text-leather-800">
                  {currentSourceData.source}
                </p>
              </div>
              <div className="bg-parchment-50 p-3 rounded-lg">
                <p className="text-sm text-ink-500">Bücher gesamt</p>
                <p className="font-medium text-leather-800">
                  {currentSourceData.totalBooks}
                </p>
              </div>
              <div className="bg-parchment-50 p-3 rounded-lg">
                <p className="text-sm text-ink-500">Aktualisiert</p>
                <p className="font-medium text-leather-800">
                  {new Date(currentSourceData.crawledAt).toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            <h4 className="font-medium text-leather-800 mb-3">
              Top 10 Bestseller:
            </h4>
            <div className="space-y-2">
              {currentSourceData.topBooks.map((book) => (
                <div
                  key={book.rank}
                  className="flex items-center justify-between py-2 border-b border-parchment-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center bg-leather-100 rounded text-sm font-medium text-leather-700">
                      {book.rank}
                    </span>
                    <div>
                      <p className="font-medium text-leather-800">
                        {book.title}
                      </p>
                      <p className="text-sm text-ink-500">{book.author}</p>
                    </div>
                  </div>
                  <a
                    href={book.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-bookmark-blue hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Data for Selected Source */}
      {!currentSourceData && (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-ink-300" />
            <p className="text-ink-500">
              Noch keine Daten für {currentSourceInfo?.name || selectedSource} vorhanden. 
              Laden Sie eine HTML-Datei hoch, um zu beginnen.
            </p>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {data?.history && data.history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Verlauf (alle Quellen)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.history.map((item) => (
                <div
                  key={item.filename}
                  className="flex items-center justify-between py-2 border-b border-parchment-100 last:border-0"
                >
                  <div>
                    <p className="font-medium text-leather-800">{item.date}</p>
                    <p className="text-sm text-ink-500">{item.source}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-leather-800">
                      {item.totalBooks} Bücher
                    </p>
                    <p className="text-xs text-ink-400">{item.filename}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
