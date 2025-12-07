import { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Quên mật khẩu | ebook1eur",
  description: "Đặt lại mật khẩu tài khoản ebook1eur của bạn",
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-cream-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-4">
            <BookOpen className="h-8 w-8 text-leather-600" />
            <span className="text-2xl font-bold text-leather-800">ebook1eur</span>
          </Link>
          <CardTitle className="text-xl">Quên mật khẩu</CardTitle>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
