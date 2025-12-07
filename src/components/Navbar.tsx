"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BookOpen, User, LogOut, Settings, ChevronDown } from "lucide-react";

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
                E-Books
              </Link>
              <Link
                href="/books?type=audiobook"
                className="text-sm font-medium text-ink-600 hover:text-leather-600 transition-colors"
              >
                Hörbücher
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isLoading ? (
              <div className="h-9 w-20 animate-pulse rounded-md bg-parchment-200" />
            ) : session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <User className="h-4 w-4" />
                    {session.user?.name || "Konto"}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>
                    {session.user?.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer">
                          <Settings className="h-4 w-4 mr-2" />
                          Admin-Bereich
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/account" className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" />
                      Mein Konto
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-bookmark-red focus:text-bookmark-red cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Abmelden
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Anmelden
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Registrieren</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
