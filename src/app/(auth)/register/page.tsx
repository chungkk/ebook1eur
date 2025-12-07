import { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import RegisterForm from "@/components/auth/RegisterForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Registrieren | ebook1eur",
  description: "Erstellen Sie ein ebook1eur-Konto, um Bücher für €1 zu kaufen",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-cream-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-4">
            <BookOpen className="h-8 w-8 text-leather-600" />
            <span className="text-2xl font-bold text-leather-800">ebook1eur</span>
          </Link>
          <CardTitle className="text-xl">Konto erstellen</CardTitle>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
      </Card>
    </div>
  );
}
