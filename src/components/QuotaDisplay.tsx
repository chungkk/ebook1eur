"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { BookOpen, Headphones, Info } from "lucide-react";
import type { QuotaInfo } from "@/types";

interface QuotaDisplayProps {
  compact?: boolean;
}

export default function QuotaDisplay({ compact = false }: QuotaDisplayProps) {
  const { data: session, status } = useSession();
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      fetchQuota();
    }
  }, [status]);

  const fetchQuota = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/user/quota");
      const data = await response.json();
      if (data.success) {
        setQuota(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch quota:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status !== "authenticated" || loading || !quota) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <BookOpen className="h-4 w-4 text-bookmark-green" />
          <span className="text-ink-600">
            {quota.ebook.remaining}/2 ebook
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Headphones className="h-4 w-4 text-bookmark-blue" />
          <span className="text-ink-600">
            {quota.audiobook.remaining}/2 sách nói
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-parchment-50 rounded-lg border border-parchment-200">
      <div className="flex items-center gap-2 mb-3">
        <Info className="h-4 w-4 text-ink-500" />
        <span className="text-sm font-medium text-ink-700">
          Hạn mức tháng {quota.month}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-bookmark-green/10 rounded-lg">
            <BookOpen className="h-5 w-5 text-bookmark-green" />
          </div>
          <div>
            <p className="text-sm text-ink-500">Ebook</p>
            <p className="font-semibold text-leather-800">
              {quota.ebook.remaining}/{quota.ebook.limit} còn lại
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-bookmark-blue/10 rounded-lg">
            <Headphones className="h-5 w-5 text-bookmark-blue" />
          </div>
          <div>
            <p className="text-sm text-ink-500">Sách nói</p>
            <p className="font-semibold text-leather-800">
              {quota.audiobook.remaining}/{quota.audiobook.limit} còn lại
            </p>
          </div>
        </div>
      </div>

      {(quota.ebook.remaining === 0 || quota.audiobook.remaining === 0) && (
        <p className="mt-3 text-xs text-ink-500">
          Hạn mức sẽ reset vào đầu tháng sau
        </p>
      )}
    </div>
  );
}
