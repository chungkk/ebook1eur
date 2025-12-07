import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Purchase from "@/models/Purchase";
import MonthlyQuota from "@/models/MonthlyQuota";
import mongoose from "mongoose";
import { getCurrentMonth } from "@/lib/quota";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(id)
      .select("name email role status createdAt")
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Get purchase history
    const purchases = await Purchase.find({
      userId: id,
      paymentStatus: "completed",
    })
      .populate("bookId", "title author type coverImage price")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // Get current month quota
    const currentMonth = getCurrentMonth();
    const quota = await MonthlyQuota.findOne({
      userId: id,
      month: currentMonth,
    }).lean();

    // Get stats
    const stats = await Purchase.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(id),
          paymentStatus: "completed",
        },
      },
      {
        $group: {
          _id: null,
          totalPurchases: { $sum: 1 },
          totalSpent: { $sum: "$amount" },
        },
      },
    ]);

    interface PopulatedBook {
      _id: { toString(): string };
      title: string;
      author: string;
      type: string;
      coverImage: string;
      price: number;
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
        },
        stats: {
          totalPurchases: stats[0]?.totalPurchases || 0,
          totalSpent: stats[0]?.totalSpent || 0,
        },
        quota: quota
          ? {
              month: quota.month,
              ebookCount: quota.ebookCount,
              audiobookCount: quota.audiobookCount,
            }
          : {
              month: currentMonth,
              ebookCount: 0,
              audiobookCount: 0,
            },
        purchases: purchases.map((p) => {
          const book = p.bookId as unknown as PopulatedBook | null;
          return {
            id: p._id.toString(),
            book: book
              ? {
                  id: book._id.toString(),
                  title: book.title,
                  author: book.author,
                  type: book.type,
                  coverImage: book.coverImage,
                }
              : null,
            amount: p.amount,
            paymentMethod: p.paymentMethod,
            createdAt: p.createdAt,
          };
        }),
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}
