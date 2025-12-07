import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import PasswordResetToken from "@/models/PasswordResetToken";
import { sendPasswordResetEmail } from "@/lib/email";
import { generateToken } from "@/lib/utils";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = forgotPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Email không hợp lệ" },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu",
      });
    }

    // Invalidate existing tokens
    await PasswordResetToken.updateMany(
      { userId: user._id, used: false },
      { used: true }
    );

    // Create new token
    const token = generateToken(32);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await PasswordResetToken.create({
      userId: user._id,
      token,
      expiresAt,
    });

    // Send email
    await sendPasswordResetEmail(user.email, token);

    return NextResponse.json({
      success: true,
      message: "Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, error: "Không thể xử lý yêu cầu" },
      { status: 500 }
    );
  }
}
