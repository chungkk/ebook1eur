import { Storage, Bucket } from "@google-cloud/storage";

let storage: Storage | null = null;
let bucket: Bucket | null = null;

function getStorage() {
  if (!storage) {
    storage = new Storage({
      projectId: process.env.GCS_PROJECT_ID,
      keyFilename: process.env.GCS_KEY_FILE,
    });
  }
  return storage;
}

function getBucket() {
  if (!bucket) {
    const bucketName = process.env.GCS_BUCKET_NAME;
    if (!bucketName) {
      throw new Error("GCS_BUCKET_NAME is not defined");
    }
    bucket = getStorage().bucket(bucketName);
  }
  return bucket;
}

export async function uploadFile(
  file: Buffer,
  destination: string,
  contentType: string
): Promise<string> {
  const blob = getBucket().file(destination);

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
  const [url] = await getBucket().file(filePath).getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + expiresInMinutes * 60 * 1000,
  });

  return url;
}

export async function deleteFile(filePath: string): Promise<void> {
  await getBucket().file(filePath).delete();
}

export async function fileExists(filePath: string): Promise<boolean> {
  const [exists] = await getBucket().file(filePath).exists();
  return exists;
}

export function getPublicUrl(filePath: string): string {
  const bucketName = process.env.GCS_BUCKET_NAME || "ebook1eur-files";
  return `https://storage.googleapis.com/${bucketName}/${filePath}`;
}

export { getStorage, getBucket };
