import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Download from "@/models/Download";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Vui lòng đăng nhập" },
        { status: 401 }
      );
    }

    const { token } = await params;

    await connectDB();

    const download = await Download.findOne({
      token,
      status: "active",
    }).populate("purchaseId");

    if (!download) {
      return NextResponse.json(
        { success: false, error: "Link tải không hợp lệ" },
        { status: 404 }
      );
    }

    const purchase = download.purchaseId as unknown as {
      userId: { toString: () => string };
    };

    // Verify ownership
    if (purchase.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Bạn không có quyền thực hiện hành động này" },
        { status: 403 }
      );
    }

    // Mark as used
    download.status = "used";
    download.usedAt = new Date();
    await download.save();

    return NextResponse.json({
      success: true,
      message: "Download completed",
    });
  } catch (error) {
    console.error("Download complete error:", error);
    return NextResponse.json(
      { success: false, error: "Không thể cập nhật trạng thái tải" },
      { status: 500 }
    );
  }
}
