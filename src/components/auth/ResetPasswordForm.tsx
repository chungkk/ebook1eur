"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff, Check, X, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    match: password === confirmPassword && password.length > 0,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Link đặt lại mật khẩu không hợp lệ");
      return;
    }

    if (!passwordChecks.length || !passwordChecks.uppercase || !passwordChecks.number) {
      setError("Mật khẩu không đáp ứng yêu cầu");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
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

  const CheckItem = ({ checked, text }: { checked: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-sm ${checked ? "text-green-600" : "text-ink-400"}`}>
      {checked ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
      {text}
    </div>
  );

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-leather-800">
          Link không hợp lệ
        </h3>
        <p className="text-ink-600 text-sm">
          Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
        </p>
        <Link href="/forgot-password">
          <Button className="mt-4">Yêu cầu link mới</Button>
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-leather-800">
          Đặt lại mật khẩu thành công!
        </h3>
        <p className="text-ink-600 text-sm">
          Bạn có thể đăng nhập với mật khẩu mới.
        </p>
        <Button onClick={() => router.push("/login")} className="mt-4">
          Đăng nhập ngay
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="password">Mật khẩu mới</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <div className="space-y-1 mt-2">
          <CheckItem checked={passwordChecks.length} text="Ít nhất 8 ký tự" />
          <CheckItem checked={passwordChecks.uppercase} text="Ít nhất 1 chữ hoa" />
          <CheckItem checked={passwordChecks.number} text="Ít nhất 1 số" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={loading}
        />
        {confirmPassword && (
          <CheckItem checked={passwordChecks.match} text="Mật khẩu khớp" />
        )}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang xử lý...
          </>
        ) : (
          "Đặt lại mật khẩu"
        )}
      </Button>
    </form>
  );
}
