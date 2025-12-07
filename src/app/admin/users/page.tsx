"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import AdminUserList from "@/components/admin/AdminUserList";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-leather-800">Benutzerverwaltung</h1>

      <Suspense
        fallback={
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-leather-600" />
          </div>
        }
      >
        <AdminUserList />
      </Suspense>
    </div>
  );
}
