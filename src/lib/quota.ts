import { connectDB } from "./db";
import MonthlyQuota from "@/models/MonthlyQuota";
import type { BookType, QuotaInfo } from "@/types";

const QUOTA_LIMIT = 2;

export function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export async function getQuota(userId: string): Promise<QuotaInfo> {
  await connectDB();

  const month = getCurrentMonth();
  const quota = await MonthlyQuota.findOne({ userId, month });

  const ebookUsed = quota?.ebookCount ?? 0;
  const audiobookUsed = quota?.audiobookCount ?? 0;

  return {
    month,
    ebook: {
      used: ebookUsed,
      remaining: QUOTA_LIMIT - ebookUsed,
      limit: QUOTA_LIMIT,
    },
    audiobook: {
      used: audiobookUsed,
      remaining: QUOTA_LIMIT - audiobookUsed,
      limit: QUOTA_LIMIT,
    },
  };
}

export async function checkQuota(
  userId: string,
  bookType: BookType
): Promise<{ canPurchase: boolean; used: number; remaining: number }> {
  await connectDB();

  const month = getCurrentMonth();
  const quota = await MonthlyQuota.findOne({ userId, month });

  if (!quota) {
    return { canPurchase: true, used: 0, remaining: QUOTA_LIMIT };
  }

  const count =
    bookType === "ebook" ? quota.ebookCount : quota.audiobookCount;

  return {
    canPurchase: count < QUOTA_LIMIT,
    used: count,
    remaining: QUOTA_LIMIT - count,
  };
}

export async function incrementQuota(
  userId: string,
  bookType: BookType
): Promise<void> {
  await connectDB();

  const month = getCurrentMonth();
  const field = bookType === "ebook" ? "ebookCount" : "audiobookCount";

  await MonthlyQuota.findOneAndUpdate(
    { userId, month },
    {
      $inc: { [field]: 1 },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true, new: true }
  );
}

export async function canPurchaseMultiple(
  userId: string,
  ebookCount: number,
  audiobookCount: number
): Promise<{ canPurchase: boolean; message?: string }> {
  const quota = await getQuota(userId);

  if (ebookCount > quota.ebook.remaining) {
    return {
      canPurchase: false,
      message: `Bạn chỉ còn ${quota.ebook.remaining} ebook có thể mua trong tháng này`,
    };
  }

  if (audiobookCount > quota.audiobook.remaining) {
    return {
      canPurchase: false,
      message: `Bạn chỉ còn ${quota.audiobook.remaining} sách nói có thể mua trong tháng này`,
    };
  }

  return { canPurchase: true };
}
