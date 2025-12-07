import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Book from "@/models/Book";
import Purchase from "@/models/Purchase";
import { createOrder } from "@/lib/paypal";
import { checkQuota, getCurrentMonth } from "@/lib/quota";
import mongoose from "mongoose";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Vui lòng đăng nhập để mua sách" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { bookId } = body;

    if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) {
      return NextResponse.json(
        { success: false, error: "ID sách không hợp lệ" },
        { status: 400 }
      );
    }

    await connectDB();

    const book = await Book.findOne({ _id: bookId, status: "active" });
    if (!book) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy sách" },
        { status: 404 }
      );
    }

    // Check quota
    const quotaCheck = await checkQuota(session.user.id, book.type);
    if (!quotaCheck.canPurchase) {
      const typeName = book.type === "ebook" ? "ebook" : "sách nói";
      return NextResponse.json(
        {
          success: false,
          error: `Bạn đã đạt giới hạn 2 ${typeName}/tháng. Vui lòng quay lại vào tháng sau.`,
          code: "QUOTA_EXCEEDED",
        },
        { status: 400 }
      );
    }

    // Check if already purchased this month
    const existingPurchase = await Purchase.findOne({
      userId: session.user.id,
      bookId: bookId,
      purchaseMonth: getCurrentMonth(),
      paymentStatus: "completed",
    });

    if (existingPurchase) {
      return NextResponse.json(
        {
          success: false,
          error: "Bạn đã mua sách này trong tháng rồi",
        },
        { status: 400 }
      );
    }

    const order = await createOrder({
      bookId: book._id.toString(),
      bookTitle: book.title,
      price: book.price,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.orderId,
      },
    });
  } catch (error) {
    console.error("PayPal checkout error:", error);
    return NextResponse.json(
      { success: false, error: "Không thể tạo đơn hàng PayPal" },
      { status: 500 }
    );
  }
}
