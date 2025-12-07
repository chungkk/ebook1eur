import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Download from "@/models/Download";
import Purchase from "@/models/Purchase";
import Book from "@/models/Book";
import { generateSignedUrl } from "@/lib/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Vui lòng đăng nhập" },
        { status: 401 }
      );
    }

    const { token } = await params;

    await connectDB();

    const download = await Download.findOne({
      token,
      status: "active",
      expiresAt: { $gt: new Date() },
    }).populate({
      path: "purchaseId",
      populate: { path: "bookId" },
    });

    if (!download) {
      return NextResponse.json(
        {
          success: false,
          error: "Link tải đã hết hạn hoặc đã được sử dụng",
          code: "DOWNLOAD_EXPIRED",
        },
        { status: 400 }
      );
    }

    const purchase = download.purchaseId as unknown as {
      userId: { toString: () => string };
      bookId: { filePath: string; title: string };
    };

    // Verify ownership
    if (purchase.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Bạn không có quyền tải file này" },
        { status: 403 }
      );
    }

    const book = purchase.bookId;

    // Generate signed URL (5 minutes validity)
    const signedUrl = await generateSignedUrl(book.filePath, 5);

    return NextResponse.json({
      success: true,
      data: {
        downloadUrl: signedUrl,
        fileName: book.title,
        token: download.token,
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { success: false, error: "Không thể tạo link tải" },
      { status: 500 }
    );
  }
}
