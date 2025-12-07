import fs from "fs/promises";
import path from "path";

const USE_LOCAL_STORAGE = process.env.STORAGE_TYPE !== "gcs";

// Local storage paths
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

async function ensureDir(dir: string) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

// GCS imports (lazy loaded)
let Storage: typeof import("@google-cloud/storage").Storage | null = null;
let bucket: import("@google-cloud/storage").Bucket | null = null;

async function getBucket() {
  if (!Storage) {
    const gcs = await import("@google-cloud/storage");
    Storage = gcs.Storage;
  }
  if (!bucket) {
    const bucketName = process.env.GCS_BUCKET_NAME;
    if (!bucketName) {
      throw new Error("GCS_BUCKET_NAME is not defined");
    }
    const storage = new Storage({
      projectId: process.env.GCS_PROJECT_ID,
      keyFilename: process.env.GCS_KEY_FILE,
    });
    bucket = storage.bucket(bucketName);
  }
  return bucket;
}

export async function uploadFile(
  file: Buffer,
  destination: string,
  contentType: string
): Promise<string> {
  if (USE_LOCAL_STORAGE) {
    const filePath = path.join(UPLOADS_DIR, destination);
    await ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, file);
    return destination;
  }

  const b = await getBucket();
  const blob = b.file(destination);
  await blob.save(file, {
    contentType,
    resumable: true,
  });
  return destination;
}

export async function generateSignedUrl(
  filePath: string,
  expiresInMinutes: number = 5
): Promise<string> {
  if (USE_LOCAL_STORAGE) {
    // For local storage, just return the public URL
    return getPublicUrl(filePath);
  }

  const b = await getBucket();
  const [url] = await b.file(filePath).getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + expiresInMinutes * 60 * 1000,
  });
  return url;
}

export async function deleteFile(filePath: string): Promise<void> {
  if (USE_LOCAL_STORAGE) {
    const fullPath = path.join(UPLOADS_DIR, filePath);
    try {
      await fs.unlink(fullPath);
    } catch {
      // File may not exist
    }
    return;
  }

  const b = await getBucket();
  await b.file(filePath).delete();
}

export async function fileExists(filePath: string): Promise<boolean> {
  if (USE_LOCAL_STORAGE) {
    try {
      await fs.access(path.join(UPLOADS_DIR, filePath));
      return true;
    } catch {
      return false;
    }
  }

  const b = await getBucket();
  const [exists] = await b.file(filePath).exists();
  return exists;
}

export function getPublicUrl(filePath: string): string {
  if (USE_LOCAL_STORAGE) {
    return `/uploads/${filePath}`;
  }
  const bucketName = process.env.GCS_BUCKET_NAME || "ebook1eur-files";
  return `https://storage.googleapis.com/${bucketName}/${filePath}`;
}
