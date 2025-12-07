import { Metadata } from "next";
import { connectDB } from "@/lib/db";

export const dynamic = "force-dynamic";
import Book from "@/models/Book";
import User from "@/models/User";
import Purchase from "@/models/Purchase";
import { BookOpen, Users, ShoppingBag, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentMonth } from "@/lib/quota";

export const metadata: Metadata = {
  title: "Admin Dashboard | ebook1eur",
};

async function getStats() {
  await connectDB();

  const currentMonth = getCurrentMonth();

  const [totalBooks, totalUsers, totalPurchases, monthlyPurchases, recentBooks] =
    await Promise.all([
      Book.countDocuments({ status: "active" }),
      User.countDocuments({ status: "active" }),
      Purchase.countDocuments({ paymentStatus: "completed" }),
      Purchase.countDocuments({
        paymentStatus: "completed",
        purchaseMonth: currentMonth,
      }),
      Book.find({ status: "active" })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("title author type createdAt")
        .lean(),
    ]);

  return {
    totalBooks,
    totalUsers,
    totalPurchases,
    monthlyPurchases,
    recentBooks,
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-leather-800">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-ink-600">
              Tổng sách
            </CardTitle>
            <BookOpen className="h-4 w-4 text-bookmark-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-leather-800">
              {stats.totalBooks}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-ink-600">
              Tổng user
            </CardTitle>
            <Users className="h-4 w-4 text-bookmark-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-leather-800">
              {stats.totalUsers}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-ink-600">
              Tổng đơn hàng
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-leather-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-leather-800">
              {stats.totalPurchases}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-ink-600">
              Đơn tháng này
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-bookmark-red" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-leather-800">
              {stats.monthlyPurchases}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Books */}
      <Card>
        <CardHeader>
          <CardTitle>Sách mới thêm gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentBooks.map((book) => (
              <div
                key={book._id.toString()}
                className="flex items-center justify-between py-2 border-b border-parchment-100 last:border-0"
              >
                <div>
                  <p className="font-medium text-leather-800">{book.title}</p>
                  <p className="text-sm text-ink-500">{book.author}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      book.type === "audiobook"
                        ? "bg-bookmark-blue/10 text-bookmark-blue"
                        : "bg-bookmark-green/10 text-bookmark-green"
                    }`}
                  >
                    {book.type === "audiobook" ? "Sách nói" : "Ebook"}
                  </span>
                  <p className="text-xs text-ink-400 mt-1">
                    {new Date(book.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              </div>
            ))}

            {stats.recentBooks.length === 0 && (
              <p className="text-center text-ink-500 py-4">Chưa có sách nào</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
