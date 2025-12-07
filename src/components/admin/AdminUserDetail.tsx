"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  User,
  Shield,
  Mail,
  Calendar,
  ShoppingBag,
  BookOpen,
  Headphones,
  Loader2,
  Ban,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  status: "active" | "blocked";
  createdAt: string;
}

interface Stats {
  totalPurchases: number;
  totalSpent: number;
}

interface Quota {
  month: string;
  ebookCount: number;
  audiobookCount: number;
}

interface Purchase {
  id: string;
  book: {
    id: string;
    title: string;
    author: string;
    type: string;
    coverImage: string;
  } | null;
  amount: number;
  paymentMethod: string;
  createdAt: string;
}

interface AdminUserDetailProps {
  userId: string;
}

export default function AdminUserDetail({ userId }: AdminUserDetailProps) {
  const [user, setUser] = useState<UserData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserDetail();
  }, [userId]);

  const fetchUserDetail = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      const data = await response.json();

      if (data.success) {
        setUser(data.data.user);
        setStats(data.data.stats);
        setQuota(data.data.quota);
        setPurchases(data.data.purchases);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Không thể tải thông tin user");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!user) return;

    const newStatus = user.status === "active" ? "blocked" : "active";
    const action = newStatus === "blocked" ? "khóa" : "mở khóa";

    if (!confirm(`Bạn có chắc muốn ${action} tài khoản này?`)) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();

      if (data.success) {
        setUser({ ...user, status: newStatus });
      } else {
        alert(data.error || "Không thể cập nhật trạng thái");
      }
    } catch {
      alert("Đã có lỗi xảy ra");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-leather-600" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || "User not found"}</p>
        <Link href="/admin/users">
          <Button className="mt-4">Quay lại danh sách</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/users"
        className="inline-flex items-center text-ink-600 hover:text-leather-700"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Quay lại danh sách
      </Link>

      {/* User Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="w-20 h-20 rounded-full bg-parchment-100 flex items-center justify-center flex-shrink-0">
              {user.role === "admin" ? (
                <Shield className="h-10 w-10 text-leather-600" />
              ) : (
                <User className="h-10 w-10 text-ink-400" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-leather-800">
                    {user.name}
                  </h2>
                  <div className="flex items-center gap-2 text-ink-500 mt-1">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm ${
                      user.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {user.status === "active" ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Hoạt động
                      </>
                    ) : (
                      <>
                        <Ban className="h-4 w-4" />
                        Đã khóa
                      </>
                    )}
                  </span>

                  {user.role !== "admin" && (
                    <Button
                      variant={user.status === "active" ? "destructive" : "default"}
                      size="sm"
                      onClick={handleToggleStatus}
                      disabled={updating}
                    >
                      {updating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : user.status === "active" ? (
                        <>
                          <Ban className="h-4 w-4 mr-1" />
                          Khóa tài khoản
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mở khóa
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mt-4 text-sm text-ink-500">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Tham gia: {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                </div>
                <span
                  className={`px-2 py-0.5 rounded ${
                    user.role === "admin"
                      ? "bg-leather-100 text-leather-700"
                      : "bg-parchment-100 text-ink-600"
                  }`}
                >
                  {user.role === "admin" ? "Admin" : "User"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-ink-600">
              Tổng đơn mua
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-leather-800">
              {stats?.totalPurchases || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-ink-600">
              Tổng chi tiêu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-leather-800">
              {formatPrice(stats?.totalSpent || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-ink-600">
              Ebook tháng này
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-leather-800">
              {quota?.ebookCount || 0}/2
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-ink-600">
              Sách nói tháng này
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-leather-800">
              {quota?.audiobookCount || 0}/2
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purchase History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Lịch sử mua hàng
          </CardTitle>
        </CardHeader>
        <CardContent>
          {purchases.length === 0 ? (
            <p className="text-center text-ink-500 py-4">Chưa có đơn hàng nào</p>
          ) : (
            <div className="space-y-3">
              {purchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="flex items-center gap-4 p-3 bg-parchment-50 rounded-lg"
                >
                  {purchase.book?.coverImage && (
                    <div className="relative w-12 h-16 rounded overflow-hidden bg-parchment-100 flex-shrink-0">
                      <Image
                        src={purchase.book.coverImage}
                        alt={purchase.book.title || ""}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-leather-800 truncate">
                        {purchase.book?.title || "Sách đã xóa"}
                      </p>
                      {purchase.book?.type && (
                        <span
                          className={`flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs ${
                            purchase.book.type === "audiobook"
                              ? "bg-bookmark-blue/10 text-bookmark-blue"
                              : "bg-bookmark-green/10 text-bookmark-green"
                          }`}
                        >
                          {purchase.book.type === "audiobook" ? (
                            <Headphones className="h-3 w-3" />
                          ) : (
                            <BookOpen className="h-3 w-3" />
                          )}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-ink-500">{purchase.book?.author}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-medium">{formatPrice(purchase.amount)}</p>
                    <p className="text-xs text-ink-400">
                      {new Date(purchase.createdAt).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
