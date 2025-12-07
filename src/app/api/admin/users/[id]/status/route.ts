import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import mongoose from "mongoose";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.enum(["active", "blocked"]),
});

export async function PATCH(
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

    // Prevent admin from blocking themselves
    if (id === session.user.id) {
      return NextResponse.json(
        { success: false, error: "Không thể thay đổi trạng thái tài khoản của chính mình" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = updateStatusSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Prevent blocking other admins
    if (user.role === "admin" && validation.data.status === "blocked") {
      return NextResponse.json(
        { success: false, error: "Không thể khóa tài khoản admin khác" },
        { status: 400 }
      );
    }

    user.status = validation.data.status;
    await user.save();

    return NextResponse.json({
      success: true,
      data: {
        id: user._id.toString(),
        status: user.status,
      },
      message:
        validation.data.status === "blocked"
          ? "Đã khóa tài khoản"
          : "Đã mở khóa tài khoản",
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update user status" },
      { status: 500 }
    );
  }
}
