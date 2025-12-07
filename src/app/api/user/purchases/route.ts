import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Purchase from "@/models/Purchase";
import Download from "@/models/Download";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Vui lòng đăng nhập" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    await connectDB();

    const [purchases, total] = await Promise.all([
      Purchase.find({
        userId: session.user.id,
        paymentStatus: "completed",
      })
        .populate("bookId", "title author type coverImage price")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Purchase.countDocuments({
        userId: session.user.id,
        paymentStatus: "completed",
      }),
    ]);

    // Get download status for each purchase
    const purchaseIds = purchases.map((p) => p._id);
    const downloads = await Download.find({
      purchaseId: { $in: purchaseIds },
    }).lean();

    const downloadMap = new Map(
      downloads.map((d) => [d.purchaseId.toString(), d])
    );

    interface PopulatedBook {
      _id: { toString(): string };
      title: string;
      author: string;
      type: string;
      coverImage: string;
      price: number;
    }

    const purchasesWithDownload = purchases.map((purchase) => {
      const download = downloadMap.get(purchase._id.toString());
      const book = purchase.bookId as unknown as PopulatedBook | null;
      return {
        id: purchase._id.toString(),
        book: book
          ? {
              id: book._id.toString(),
              title: book.title,
              author: book.author,
              type: book.type,
              coverImage: book.coverImage,
              price: book.price,
            }
          : null,
        amount: purchase.amount,
        paymentMethod: purchase.paymentMethod,
        purchaseMonth: purchase.purchaseMonth,
        createdAt: purchase.createdAt,
        download: download
          ? {
              token: download.token,
              status: download.status,
              expiresAt: download.expiresAt,
              canDownload:
                download.status === "active" &&
                new Date(download.expiresAt) > new Date(),
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        purchases: purchasesWithDownload,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching purchases:", error);
    return NextResponse.json(
      { success: false, error: "Không thể tải lịch sử mua hàng" },
      { status: 500 }
    );
  }
}
