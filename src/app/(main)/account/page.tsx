import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { User, ShoppingBag, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import QuotaDisplay from "@/components/QuotaDisplay";
import PurchaseHistory from "@/components/account/PurchaseHistory";
import ProfileForm from "@/components/account/ProfileForm";

export const metadata: Metadata = {
  title: "Konto | ebook1eur",
  description: "Verwalten Sie Ihr ebook1eur-Konto",
};

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-leather-800 mb-6">Mein Konto</h1>

        <div className="grid gap-6">
          {/* Quota Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShoppingBag className="h-5 w-5" />
                Kaufkontingent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <QuotaDisplay />
            </CardContent>
          </Card>

          {/* Recent Purchases */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShoppingBag className="h-5 w-5" />
                Kürzlich gekaufte Bücher
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PurchaseHistory limit={5} showViewAll />
            </CardContent>
          </Card>

          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-5 w-5" />
                Kontoinformationen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
