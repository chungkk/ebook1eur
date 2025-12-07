import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getQuota } from "@/lib/quota";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Vui lòng đăng nhập" },
        { status: 401 }
      );
    }

    const quota = await getQuota(session.user.id);

    return NextResponse.json({
      success: true,
      data: quota,
    });
  } catch (error) {
    console.error("Error fetching quota:", error);
    return NextResponse.json(
      { success: false, error: "Không thể tải thông tin hạn mức" },
      { status: 500 }
    );
  }
}
