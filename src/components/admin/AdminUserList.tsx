"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  Shield,
  Search,
  Loader2,
  Ban,
  CheckCircle,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  status: "active" | "blocked";
  createdAt: string;
  purchaseCount: number;
  totalSpent: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminUserList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [users, setUsers] = useState<UserData[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");

  useEffect(() => {
    fetchUsers();
  }, [searchParams]);

  const fetchUsers = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchParams.get("search")) params.set("search", searchParams.get("search")!);
    if (searchParams.get("status")) params.set("status", searchParams.get("status")!);
    if (searchParams.get("page")) params.set("page", searchParams.get("page")!);

    try {
      const response = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.data.users);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleToggleStatus = async (user: UserData) => {
    const newStatus = user.status === "active" ? "blocked" : "active";
    const action = newStatus === "blocked" ? "sperren" : "entsperren";

    if (!confirm(`Sind Sie sicher, dass Sie das Konto "${user.name}" ${action} möchten?`)) return;

    setUpdating(user.id);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();

      if (data.success) {
        fetchUsers();
      } else {
        alert(data.error || "Status konnte nicht aktualisiert werden");
      }
    } catch (error) {
      console.error("Failed to update user status:", error);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <Input
            placeholder="Nach Name oder E-Mail suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 px-3 rounded-md border border-parchment-300 bg-white"
        >
          <option value="">Alle Status</option>
          <option value="active">Aktiv</option>
          <option value="blocked">Gesperrt</option>
        </select>
        <Button type="submit">Suchen</Button>
      </form>

      {/* User List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-leather-600" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-ink-500">
          Keine Benutzer gefunden
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-parchment-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-parchment-50 border-b border-parchment-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-ink-600">
                  Benutzer
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-ink-600">
                  Rolle
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-ink-600">
                  Käufe
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-ink-600">
                  Ausgaben
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-ink-600">
                  Status
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-ink-600">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-parchment-100">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className={user.status === "blocked" ? "bg-red-50/50" : ""}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-parchment-100 flex items-center justify-center">
                        {user.role === "admin" ? (
                          <Shield className="h-5 w-5 text-leather-600" />
                        ) : (
                          <User className="h-5 w-5 text-ink-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-leather-800">{user.name}</p>
                        <p className="text-sm text-ink-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        user.role === "admin"
                          ? "bg-leather-100 text-leather-700"
                          : "bg-parchment-100 text-ink-600"
                      }`}
                    >
                      {user.role === "admin" ? "Admin" : "User"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{user.purchaseCount}</td>
                  <td className="px-4 py-3 text-sm">
                    {formatPrice(user.totalSpent)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${
                        user.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {user.status === "active" ? (
                        <>
                          <CheckCircle className="h-3 w-3" />
                          Aktiv
                        </>
                      ) : (
                        <>
                          <Ban className="h-3 w-3" />
                          Gesperrt
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/users/${user.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      {user.role !== "admin" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(user)}
                          disabled={updating === user.id}
                        >
                          {updating === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : user.status === "active" ? (
                            <Ban className="h-4 w-4 text-red-500" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
            (page) => (
              <Button
                key={page}
                variant={pagination.page === page ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("page", page.toString());
                  router.push(`/admin/users?${params.toString()}`);
                }}
              >
                {page}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
}
