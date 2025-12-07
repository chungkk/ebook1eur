import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Settings,
  ArrowLeft,
} from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-parchment-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-leather-800 text-white p-4 flex-shrink-0">
          <div className="mb-8">
            <Link href="/" className="flex items-center gap-2 text-cream-50">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Quay lại trang chủ</span>
            </Link>
          </div>

          <h2 className="text-lg font-bold mb-6">Admin Panel</h2>

          <nav className="space-y-2">
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-leather-700 transition-colors"
            >
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </Link>
            <Link
              href="/admin/books"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-leather-700 transition-colors"
            >
              <BookOpen className="h-5 w-5" />
              Quản lý sách
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-leather-700 transition-colors"
            >
              <Users className="h-5 w-5" />
              Quản lý user
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
