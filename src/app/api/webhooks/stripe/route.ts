import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { connectDB } from "@/lib/db";
import Book from "@/models/Book";
import Purchase from "@/models/Purchase";
import Download from "@/models/Download";
import { verifyWebhookSignature } from "@/lib/stripe";
import { incrementQuota, getCurrentMonth } from "@/lib/quota";
import { generateToken } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { success: false, error: "Missing signature" },
        { status: 400 }
      );
    }

    let event;
    try {
      event = await verifyWebhookSignature(body, signature);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 400 }
      );
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const { bookId, userId } = session.metadata || {};

      if (!bookId || !userId) {
        console.error("Missing metadata in checkout session");
        return NextResponse.json({ success: true });
      }

      await connectDB();

      // Check for duplicate (idempotency)
      const existingPurchase = await Purchase.findOne({
        paymentId: session.id,
      });

      if (existingPurchase) {
        console.log("Purchase already processed:", session.id);
        return NextResponse.json({ success: true });
      }

      const book = await Book.findById(bookId);
      if (!book) {
        console.error("Book not found:", bookId);
        return NextResponse.json({ success: true });
      }

      // Create purchase record
      const purchase = await Purchase.create({
        userId,
        bookId: book._id,
        amount: book.price,
        paymentMethod: "stripe",
        paymentStatus: "completed",
        paymentId: session.id,
        purchaseMonth: getCurrentMonth(),
      });

      // Increment quota
      await incrementQuota(userId, book.type);

      // Create download token
      const downloadToken = generateToken(32);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await Download.create({
        purchaseId: purchase._id,
        token: downloadToken,
        status: "active",
        expiresAt,
      });

      console.log("Purchase completed:", purchase._id.toString());
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json(
      { success: false, error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
