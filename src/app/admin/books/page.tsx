"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import AdminBookList from "@/components/admin/AdminBookList";

export default function AdminBooksPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-leather-800">Bücherverwaltung</h1>

      <Suspense
        fallback={
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-leather-600" />
          </div>
        }
      >
        <AdminBookList />
      </Suspense>
    </div>
  );
}
