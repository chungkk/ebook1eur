import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Book from "@/models/Book";
import Purchase from "@/models/Purchase";
import mongoose from "mongoose";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import JSZip from "jszip";

const USE_LOCAL_STORAGE = process.env.STORAGE_TYPE !== "gcs";

// Generate session-based encryption key (different for each request)
function generateSessionKey(): { key: Buffer; iv: Buffer; token: string } {
  const iv = crypto.randomBytes(16);
  const key = crypto.randomBytes(32);
  const token = Buffer.concat([key, iv]).toString("base64");
  return { key, iv, token };
}

function encryptWithSession(buffer: Buffer, key: Buffer, iv: Buffer): Uint8Array {
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return new Uint8Array(encrypted);
}

// Extract only first N chapters/sections from epub for trial
async function extractTrialContent(epubBuffer: Buffer, maxSections: number = 3): Promise<Buffer> {
  const zip = await JSZip.loadAsync(epubBuffer);
  const newZip = new JSZip();
  
  // Copy mimetype first (must be uncompressed)
  const mimetype = zip.file("mimetype");
  if (mimetype) {
    newZip.file("mimetype", await mimetype.async("uint8array"), { compression: "STORE" });
  }
  
  // Copy META-INF
  const metaInf = zip.folder("META-INF");
  if (metaInf) {
    const metaFiles = metaInf.file(/.*/);
    for (const file of metaFiles) {
      if (!file.dir) {
        newZip.file(file.name, await file.async("uint8array"));
      }
    }
  }
  
  // Find and parse content.opf to get spine order
  let contentOpfPath = "OEBPS/content.opf";
  let opfContent = "";
  
  // Try common locations
  const possibleOpfPaths = ["OEBPS/content.opf", "content.opf", "OPS/content.opf"];
  for (const opfPath of possibleOpfPaths) {
    const opfFile = zip.file(opfPath);
    if (opfFile) {
      contentOpfPath = opfPath;
      opfContent = await opfFile.async("string");
      break;
    }
  }
  
  // Also check container.xml for actual rootfile location
  const containerFile = zip.file("META-INF/container.xml");
  if (containerFile && !opfContent) {
    const containerXml = await containerFile.async("string");
    const rootfileMatch = containerXml.match(/full-path="([^"]+)"/);
    if (rootfileMatch) {
      const opfFile = zip.file(rootfileMatch[1]);
      if (opfFile) {
        contentOpfPath = rootfileMatch[1];
        opfContent = await opfFile.async("string");
      }
    }
  }
  
  if (!opfContent) {
    // If we can't parse, just return a small portion
    throw new Error("Cannot parse epub structure");
  }
  
  const opfDir = contentOpfPath.substring(0, contentOpfPath.lastIndexOf("/") + 1);
  
  // Parse spine to get reading order
  const spineMatch = opfContent.match(/<spine[^>]*>([\s\S]*?)<\/spine>/);
  const manifestMatch = opfContent.match(/<manifest[^>]*>([\s\S]*?)<\/manifest>/);
  
  if (!spineMatch || !manifestMatch) {
    throw new Error("Cannot parse epub spine/manifest");
  }
  
  // Get itemrefs from spine
  const itemrefMatches = spineMatch[1].matchAll(/<itemref[^>]*idref="([^"]+)"[^>]*\/?>/g);
  const spineItems: string[] = [];
  for (const match of itemrefMatches) {
    spineItems.push(match[1]);
  }
  
  // Build manifest map (id -> href)
  const manifestMap = new Map<string, string>();
  const itemMatches = manifestMatch[1].matchAll(/<item[^>]*id="([^"]+)"[^>]*href="([^"]+)"[^>]*\/?>/g);
  for (const match of itemMatches) {
    manifestMap.set(match[1], match[2]);
  }
  
  // Get only first N content files based on spine order
  const allowedFiles = new Set<string>();
  const trialSpineItems = spineItems.slice(0, maxSections);
  
  for (const itemId of trialSpineItems) {
    const href = manifestMap.get(itemId);
    if (href) {
      allowedFiles.add(opfDir + href);
    }
  }
  
  // Always include necessary files (CSS, images referenced in trial content, etc.)
  // Copy all CSS and font files
  const allFiles = Object.keys(zip.files);
  for (const filePath of allFiles) {
    const file = zip.files[filePath];
    if (file.dir) continue;
    
    const ext = filePath.toLowerCase().split(".").pop();
    if (["css", "ttf", "otf", "woff", "woff2", "ncx", "opf"].includes(ext || "")) {
      allowedFiles.add(filePath);
    }
  }
  
  // Copy allowed content files
  for (const filePath of allFiles) {
    const file = zip.files[filePath];
    if (file.dir) continue;
    
    if (allowedFiles.has(filePath)) {
      newZip.file(filePath, await file.async("uint8array"));
    }
  }
  
  // Modify content.opf to only include trial items in spine
  let modifiedOpf = opfContent;
  
  // Keep only trial items in spine
  const newSpineItems = trialSpineItems.map(id => `<itemref idref="${id}"/>`).join("\n    ");
  modifiedOpf = modifiedOpf.replace(
    /<spine[^>]*>[\s\S]*?<\/spine>/,
    `<spine toc="ncx">\n    ${newSpineItems}\n  </spine>`
  );
  
  newZip.file(contentOpfPath, modifiedOpf);
  
  // Generate the trial epub
  const trialBuffer = await newZip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    mimeType: "application/epub+zip",
  });
  
  return trialBuffer;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") || "full";

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid book ID" }, { status: 400 });
  }

  try {
    await connectDB();
    const book = await Book.findOne({ _id: id, status: "active" });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    if (book.type !== "ebook") {
      return NextResponse.json(
        { error: "This is not an ebook" },
        { status: 400 }
      );
    }

    // Check purchase status for full access
    const session = await auth();
    let hasPurchased = false;
    
    if (session?.user?.id) {
      const purchase = await Purchase.findOne({
        userId: session.user.id,
        bookId: id,
        paymentStatus: "completed",
      });
      hasPurchased = !!purchase;
    }

    // If requesting full access but hasn't purchased, deny
    if (mode === "full" && !hasPurchased) {
      return NextResponse.json(
        { error: "Bạn cần mua sách để đọc toàn bộ nội dung", requirePurchase: true },
        { status: 403 }
      );
    }

    // Get file buffer based on storage type
    let fileBuffer: Buffer;
    
    if (USE_LOCAL_STORAGE) {
      const filePath = path.join(
        process.cwd(),
        "public",
        "uploads",
        book.filePath
      );

      try {
        fileBuffer = await fs.readFile(filePath);
      } catch {
        return NextResponse.json(
          { error: "File not found on server" },
          { status: 404 }
        );
      }
    } else {
      // For GCS, fetch the file
      const { generateSignedUrl } = await import("@/lib/storage");
      const signedUrl = await generateSignedUrl(book.filePath, 60);
      const response = await fetch(signedUrl);
      const arrayBuffer = await response.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    }
    
    // For trial mode, extract only trial content (first 3 chapters)
    let contentToServe = fileBuffer;
    if (mode === "trial") {
      try {
        contentToServe = await extractTrialContent(fileBuffer, 3);
      } catch (err) {
        console.error("Error extracting trial content:", err);
        // If extraction fails, serve a very limited portion
        contentToServe = fileBuffer.subarray(0, Math.min(fileBuffer.length, 100000));
      }
    }
    
    // Generate session-specific encryption key
    const { key, iv, token } = generateSessionKey();
    
    // Encrypt the content with session key
    const encryptedBuffer = encryptWithSession(contentToServe, key, iv);
    
    return new NextResponse(encryptedBuffer.buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Content-Encrypted": "true",
        "X-Encryption-Token": token, // Session key for decryption
        "X-Trial-Mode": mode === "trial" ? "true" : "false",
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'",
      },
    });
  } catch (error) {
    console.error("Error serving book file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
