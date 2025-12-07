import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadFile, getPublicUrl } from "@/lib/storage";

const MAX_COVER_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_BOOK_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

const ALLOWED_COVER_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_BOOK_TYPES = [
  "application/pdf",
  "application/epub+zip",
  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
];

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const uploadType = formData.get("type") as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type and size
    if (uploadType === "cover") {
      if (!ALLOWED_COVER_TYPES.includes(file.type)) {
        return NextResponse.json(
          { success: false, error: "Chỉ chấp nhận file ảnh JPG, PNG, WebP" },
          { status: 400 }
        );
      }
      if (file.size > MAX_COVER_SIZE) {
        return NextResponse.json(
          { success: false, error: "Ảnh bìa không được quá 5MB" },
          { status: 400 }
        );
      }
    } else if (uploadType === "book") {
      if (!ALLOWED_BOOK_TYPES.includes(file.type)) {
        return NextResponse.json(
          { success: false, error: "Chỉ chấp nhận file PDF, EPUB, MP3, M4A" },
          { status: 400 }
        );
      }
      if (file.size > MAX_BOOK_SIZE) {
        return NextResponse.json(
          { success: false, error: "File sách không được quá 2GB" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid upload type" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split(".").pop();
    const folder = uploadType === "cover" ? "covers" : "books";
    const filename = `${folder}/${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`;

    // Convert to buffer and upload
    const buffer = Buffer.from(await file.arrayBuffer());
    const path = await uploadFile(buffer, filename, file.type);

    // Return appropriate response
    if (uploadType === "cover") {
      return NextResponse.json({
        success: true,
        data: {
          url: getPublicUrl(path),
          path,
        },
      });
    } else {
      return NextResponse.json({
        success: true,
        data: {
          path,
          size: file.size,
          filename: file.name,
        },
      });
    }
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, error: "Upload failed" },
      { status: 500 }
    );
  }
}
