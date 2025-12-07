import Link from "next/link";
import { FileQuestion, Home, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-cream-50">
      <div className="text-center max-w-md">
        <div className="mx-auto w-16 h-16 bg-parchment-100 rounded-full flex items-center justify-center mb-4">
          <FileQuestion className="h-8 w-8 text-leather-600" />
        </div>
        <h1 className="text-2xl font-bold text-leather-800 mb-2">
          Không tìm thấy trang
        </h1>
        <p className="text-ink-600 mb-6">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/">
            <Button>
              <Home className="mr-2 h-4 w-4" />
              Về trang chủ
            </Button>
          </Link>
          <Link href="/books">
            <Button variant="outline">
              <BookOpen className="mr-2 h-4 w-4" />
              Xem sách
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
