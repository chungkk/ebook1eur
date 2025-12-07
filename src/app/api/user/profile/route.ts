import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { z } from "zod";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Vui lòng đăng nhập" },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findById(session.user.id)
      .select("name email role createdAt")
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy người dùng" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { success: false, error: "Không thể tải thông tin tài khoản" },
      { status: 500 }
    );
  }
}

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Vui lòng đăng nhập" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Dữ liệu không hợp lệ" },
        { status: 400 }
      );
    }

    const { name, currentPassword, newPassword } = validation.data;

    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy người dùng" },
        { status: 404 }
      );
    }

    // Update name if provided
    if (name) {
      user.name = name;
    }

    // Update password if provided
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: "Vui lòng nhập mật khẩu hiện tại" },
          { status: 400 }
        );
      }

      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: "Mật khẩu hiện tại không đúng" },
          { status: 400 }
        );
      }

      user.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: "Cập nhật thành công",
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { success: false, error: "Không thể cập nhật thông tin" },
      { status: 500 }
    );
  }
}
