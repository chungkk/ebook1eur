import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Book from "@/models/Book";
import Purchase from "@/models/Purchase";
import { createCheckoutSession } from "@/lib/stripe";
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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const checkoutSession = await createCheckoutSession({
      bookId: book._id.toString(),
      bookTitle: book.title,
      price: book.price,
      userId: session.user.id,
      successUrl: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/books/${bookId}`,
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: checkoutSession.id,
        url: checkoutSession.url,
      },
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { success: false, error: "Không thể tạo phiên thanh toán" },
      { status: 500 }
    );
  }
}
