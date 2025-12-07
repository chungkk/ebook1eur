import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Purchase from "@/models/Purchase";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const skip = (page - 1) * limit;

    await connectDB();

    const query: Record<string, unknown> = {};

    if (status && ["active", "blocked"].includes(status)) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select("name email role status createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    // Get purchase counts for each user
    const userIds = users.map((u) => u._id);
    const purchaseCounts = await Purchase.aggregate([
      {
        $match: {
          userId: { $in: userIds },
          paymentStatus: "completed",
        },
      },
      {
        $group: {
          _id: "$userId",
          count: { $sum: 1 },
          totalSpent: { $sum: "$amount" },
        },
      },
    ]);

    const purchaseMap = new Map(
      purchaseCounts.map((p) => [p._id.toString(), p])
    );

    const usersWithStats = users.map((user) => {
      const stats = purchaseMap.get(user._id.toString());
      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        purchaseCount: stats?.count || 0,
        totalSpent: stats?.totalSpent || 0,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        users: usersWithStats,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
