import { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import LoginForm from "@/components/auth/LoginForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Đăng nhập | ebook1eur",
  description: "Đăng nhập vào tài khoản ebook1eur của bạn",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-cream-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-4">
            <BookOpen className="h-8 w-8 text-leather-600" />
            <span className="text-2xl font-bold text-leather-800">ebook1eur</span>
          </Link>
          <CardTitle className="text-xl">Đăng nhập</CardTitle>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
