import { Metadata } from "next";
import BookForm from "@/components/admin/BookForm";

export const metadata: Metadata = {
  title: "Thêm sách mới | Admin | ebook1eur",
};

export default function NewBookPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-leather-800">Thêm sách mới</h1>
      <BookForm mode="create" />
    </div>
  );
}
