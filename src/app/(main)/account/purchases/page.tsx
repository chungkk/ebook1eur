import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PurchaseHistory from "@/components/account/PurchaseHistory";

export const metadata: Metadata = {
  title: "Lịch sử mua hàng | ebook1eur",
  description: "Xem lịch sử mua sách của bạn",
};

export default async function PurchasesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/account"
          className="inline-flex items-center text-ink-600 hover:text-leather-700 mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại tài khoản
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Lịch sử mua hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <PurchaseHistory />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
