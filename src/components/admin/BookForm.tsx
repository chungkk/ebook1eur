"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BookData {
  id?: string;
  title: string;
  description: string;
  author: string;
  type: "ebook" | "audiobook";
  price: number;
  duration?: number;
  coverImage: string;
  filePath: string;
  fileSize: number;
}

interface BookFormProps {
  book?: BookData;
  mode: "create" | "edit";
}

export default function BookForm({ book, mode }: BookFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState(book?.title || "");
  const [description, setDescription] = useState(book?.description || "");
  const [author, setAuthor] = useState(book?.author || "");
  const [type, setType] = useState<"ebook" | "audiobook">(book?.type || "ebook");
  const [price, setPrice] = useState(book?.price?.toString() || "1");
  const [duration, setDuration] = useState(book?.duration?.toString() || "");
  const [coverImage, setCoverImage] = useState(book?.coverImage || "");
  const [filePath, setFilePath] = useState(book?.filePath || "");
  const [fileSize, setFileSize] = useState(book?.fileSize?.toString() || "");

  // Upload state
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "cover");

    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        setCoverImage(data.data.url);
      } else {
        setError(data.error || "Upload failed");
      }
    } catch {
      setError("Upload failed");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "book");

    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        setFilePath(data.data.path);
        setFileSize(data.data.size.toString());
      } else {
        setError(data.error || "Upload failed");
      }
    } catch {
      setError("Upload failed");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const bookData = {
      title,
      description,
      author,
      type,
      price: parseFloat(price),
      duration: type === "audiobook" ? parseInt(duration) || undefined : undefined,
      coverImage,
      filePath,
      fileSize: parseInt(fileSize),
    };

    try {
      const url = mode === "create" ? "/api/admin/books" : `/api/admin/books/${book?.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookData),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Failed to save book");
        return;
      }

      router.push("/admin/books");
      router.refresh();
    } catch {
      setError("Failed to save book");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="title">Buchtitel *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="author">Autor *</Label>
          <Input
            id="author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Typ *</Label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as "ebook" | "audiobook")}
            className="w-full h-10 px-3 rounded-md border border-parchment-300 bg-white"
            disabled={loading}
          >
            <option value="ebook">E-Book</option>
            <option value="audiobook">Hörbuch</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Preis (EUR) *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        {type === "audiobook" && (
          <div className="space-y-2">
            <Label htmlFor="duration">Dauer (Minuten)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              disabled={loading}
            />
          </div>
        )}

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Beschreibung *</Label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 rounded-md border border-parchment-300 bg-white resize-none"
            required
            disabled={loading}
          />
        </div>

        {/* Cover Upload */}
        <div className="space-y-2 sm:col-span-2">
          <Label>Titelbild *</Label>
          {coverImage ? (
            <div className="flex items-center gap-4">
              <img
                src={coverImage}
                alt="Cover preview"
                className="w-24 h-32 object-cover rounded"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCoverImage("")}
                disabled={loading}
              >
                <X className="h-4 w-4 mr-1" />
                Entfernen
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-parchment-400 rounded-lg cursor-pointer hover:bg-parchment-50">
                {uploadingCover ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                <span className="text-sm">Titelbild hochladen</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                  disabled={loading || uploadingCover}
                />
              </label>
              <span className="text-xs text-ink-500">oder</span>
              <Input
                placeholder="Titelbild-URL"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="flex-1"
                disabled={loading}
              />
            </div>
          )}
        </div>

        {/* File Upload */}
        <div className="space-y-2 sm:col-span-2">
          <Label>Buchdatei *</Label>
          {filePath ? (
            <div className="flex items-center gap-4 p-3 bg-parchment-50 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium">{filePath}</p>
                <p className="text-xs text-ink-500">
                  {(parseInt(fileSize) / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilePath("");
                  setFileSize("");
                }}
                disabled={loading}
              >
                <X className="h-4 w-4 mr-1" />
                Entfernen
              </Button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 p-6 border border-dashed border-parchment-400 rounded-lg cursor-pointer hover:bg-parchment-50">
              {uploadingFile ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Upload className="h-5 w-5" />
              )}
              <span>Buchdatei hochladen (PDF, EPUB, MP3)</span>
              <input
                type="file"
                accept=".pdf,.epub,.mp3,.m4a,.m4b"
                onChange={handleFileUpload}
                className="hidden"
                disabled={loading || uploadingFile}
              />
            </label>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading || !coverImage || !filePath}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Wird gespeichert...
            </>
          ) : mode === "create" ? (
            "Buch erstellen"
          ) : (
            "Aktualisieren"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/books")}
          disabled={loading}
        >
          Abbrechen
        </Button>
      </div>
    </form>
  );
}
