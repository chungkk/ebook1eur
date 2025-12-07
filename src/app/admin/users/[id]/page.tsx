import { Metadata } from "next";
import AdminUserDetail from "@/components/admin/AdminUserDetail";

export const metadata: Metadata = {
  title: "Chi tiết user | Admin | ebook1eur",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <AdminUserDetail userId={id} />
    </div>
  );
}
