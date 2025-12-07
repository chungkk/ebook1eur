"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Đã có lỗi xảy ra");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Đã có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-leather-800">
          Kiểm tra email của bạn
        </h3>
        <p className="text-ink-600 text-sm">
          Nếu email tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu trong vài phút.
        </p>
        <Link href="/login">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại đăng nhập
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-ink-600 text-sm">
        Nhập email của bạn và chúng tôi sẽ gửi link đặt lại mật khẩu.
      </p>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang gửi...
          </>
        ) : (
          "Gửi link đặt lại mật khẩu"
        )}
      </Button>

      <Link
        href="/login"
        className="flex items-center justify-center text-sm text-ink-600 hover:text-leather-600"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Quay lại đăng nhập
      </Link>
    </form>
  );
}
