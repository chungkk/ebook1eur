"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { BookOpen, User, LogOut, Settings } from "lucide-react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const isAdmin = session?.user?.role === "admin";

  return (
    <nav className="sticky top-0 z-50 border-b border-parchment-300 bg-cream-50/95 backdrop-blur supports-[backdrop-filter]:bg-cream-50/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-leather-600" />
              <span className="text-xl font-bold text-leather-800">
                Ebook1eur
              </span>
            </Link>

            <div className="hidden md:flex md:gap-6">
              <Link
                href="/books?type=ebook"
                className="text-sm font-medium text-ink-600 hover:text-leather-600 transition-colors"
              >
                Ebook
              </Link>
              <Link
                href="/books?type=audiobook"
                className="text-sm font-medium text-ink-600 hover:text-leather-600 transition-colors"
              >
                Sách nói
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isLoading ? (
              <div className="h-9 w-20 animate-pulse rounded-md bg-parchment-200" />
            ) : session ? (
              <>
                {isAdmin && (
                  <Link href="/admin">
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4 mr-1" />
                      Admin
                    </Button>
                  </Link>
                )}
                <Link href="/account">
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4 mr-1" />
                    {session.user?.name || "Tài khoản"}
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Đăng xuất
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Đăng nhập
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Đăng ký</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
