import Link from "next/link";
import { BookOpen, Headphones, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import BookList from "@/components/BookList";
import { connectDB } from "@/lib/db";
import Book from "@/models/Book";

async function getRecentBooks() {
  try {
    await connectDB();
    const books = await Book.find({ status: "active" })
      .select("title description author type duration price coverImage")
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    return books.map((book) => ({
      id: book._id.toString(),
      title: book.title,
      description: book.description,
      author: book.author,
      type: book.type as "ebook" | "audiobook",
      duration: book.duration,
      price: book.price,
      coverImage: book.coverImage,
    }));
  } catch {
    return [];
  }
}

export default async function Home() {
  const recentBooks = await getRecentBooks();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-cream-100 to-cream-50 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-leather-900 mb-6">
            Sách hay chỉ với{" "}
            <span className="text-bookmark-gold">1 EUR</span>
          </h1>
          <p className="text-lg md:text-xl text-ink-600 mb-8 max-w-2xl mx-auto">
            Khám phá kho tàng ebook và sách nói chất lượng cao. Mỗi tháng bạn có thể mua 2 ebook và 2 sách nói.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/books?type=ebook">
              <Button size="lg" className="w-full sm:w-auto">
                <BookOpen className="mr-2 h-5 w-5" />
                Xem Ebook
              </Button>
            </Link>
            <Link href="/books?type=audiobook">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                <Headphones className="mr-2 h-5 w-5" />
                Xem Sách nói
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Recent Books */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-leather-800">
              Sách mới nhất
            </h2>
            <Link href="/books">
              <Button variant="ghost">
                Xem tất cả
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {recentBooks.length > 0 ? (
            <BookList initialBooks={recentBooks} showLoadMore={false} />
          ) : (
            <div className="text-center py-12 bg-parchment-50 rounded-lg">
              <BookOpen className="mx-auto h-12 w-12 text-ink-300 mb-4" />
              <p className="text-ink-500">Chưa có sách nào. Quay lại sau nhé!</p>
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 md:py-16 bg-parchment-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-leather-800 text-center mb-8">
            Danh mục
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Link
              href="/books?type=ebook"
              className="group p-8 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-parchment-200"
            >
              <div className="flex items-center gap-4">
                <div className="p-4 bg-bookmark-green/10 rounded-lg group-hover:bg-bookmark-green/20 transition-colors">
                  <BookOpen className="h-8 w-8 text-bookmark-green" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-leather-800">
                    Ebook
                  </h3>
                  <p className="text-ink-500">
                    Sách điện tử PDF, EPUB
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/books?type=audiobook"
              className="group p-8 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-parchment-200"
            >
              <div className="flex items-center gap-4">
                <div className="p-4 bg-bookmark-blue/10 rounded-lg group-hover:bg-bookmark-blue/20 transition-colors">
                  <Headphones className="h-8 w-8 text-bookmark-blue" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-leather-800">
                    Sách nói
                  </h3>
                  <p className="text-ink-500">
                    Audio book MP3, M4A
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
