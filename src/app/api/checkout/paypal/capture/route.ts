import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Book from "@/models/Book";
import Purchase from "@/models/Purchase";
import Download from "@/models/Download";
import { captureOrder } from "@/lib/paypal";
import { incrementQuota, getCurrentMonth } from "@/lib/quota";
import { generateToken } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Vui lòng đăng nhập" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Order ID không hợp lệ" },
        { status: 400 }
      );
    }

    const captureResult = await captureOrder(orderId);

    if (captureResult.status !== "COMPLETED") {
      return NextResponse.json(
        { success: false, error: "Thanh toán chưa hoàn tất" },
        { status: 400 }
      );
    }

    await connectDB();

    const book = await Book.findById(captureResult.bookId);
    if (!book) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy sách" },
        { status: 404 }
      );
    }

    // Create purchase record
    const purchase = await Purchase.create({
      userId: session.user.id,
      bookId: book._id,
      amount: book.price,
      paymentMethod: "paypal",
      paymentStatus: "completed",
      paymentId: captureResult.paymentId,
      purchaseMonth: getCurrentMonth(),
    });

    // Increment quota
    await incrementQuota(session.user.id, book.type);

    // Create download token
    const downloadToken = generateToken(32);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await Download.create({
      purchaseId: purchase._id,
      token: downloadToken,
      status: "active",
      expiresAt,
    });

    return NextResponse.json({
      success: true,
      data: {
        purchaseId: purchase._id.toString(),
        downloadToken,
      },
    });
  } catch (error) {
    console.error("PayPal capture error:", error);
    return NextResponse.json(
      { success: false, error: "Không thể xử lý thanh toán" },
      { status: 500 }
    );
  }
}
