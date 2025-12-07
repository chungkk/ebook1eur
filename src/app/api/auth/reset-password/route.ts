import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import PasswordResetToken from "@/models/PasswordResetToken";
import bcrypt from "bcryptjs";
import { z } from "zod";

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token không hợp lệ"),
  password: z
    .string()
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
    .regex(/[A-Z]/, "Mật khẩu phải có ít nhất 1 chữ hoa")
    .regex(/[0-9]/, "Mật khẩu phải có ít nhất 1 số"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = resetPasswordSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "Dữ liệu không hợp lệ";
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      );
    }

    const { token, password } = validation.data;

    await connectDB();

    const resetToken = await PasswordResetToken.findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!resetToken) {
      return NextResponse.json(
        { success: false, error: "Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.findByIdAndUpdate(resetToken.userId, {
      password: hashedPassword,
    });

    // Mark token as used
    resetToken.used = true;
    await resetToken.save();

    return NextResponse.json({
      success: true,
      message: "Mật khẩu đã được đặt lại thành công",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, error: "Không thể đặt lại mật khẩu" },
      { status: 500 }
    );
  }
}
