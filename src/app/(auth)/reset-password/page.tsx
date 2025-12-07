"use client";

import { Suspense } from "react";
import Link from "next/link";
import { BookOpen, Loader2 } from "lucide-react";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function ResetPasswordContent() {
  return <ResetPasswordForm />;
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-cream-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-4">
            <BookOpen className="h-8 w-8 text-leather-600" />
            <span className="text-2xl font-bold text-leather-800">ebook1eur</span>
          </Link>
          <CardTitle className="text-xl">Passwort zurücksetzen</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-leather-600" />
              </div>
            }
          >
            <ResetPasswordContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
