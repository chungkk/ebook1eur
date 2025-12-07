import Image from "next/image";
import Link from "next/link";
import { BookOpen, Headphones, Clock } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice, formatDuration } from "@/lib/utils";
import type { BookType } from "@/types";

interface BookCardProps {
  id: string;
  title: string;
  author: string;
  description: string;
  type: BookType;
  price: number;
  coverImage: string;
  duration?: number;
}

export default function BookCard({
  id,
  title,
  author,
  description,
  type,
  price,
  coverImage,
  duration,
}: BookCardProps) {
  const isAudiobook = type === "audiobook";

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
      <Link href={`/books/${id}`}>
        <div className="relative aspect-[3/4] overflow-hidden bg-parchment-100">
          <Image
            src={coverImage}
            alt={title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
          <div className="absolute top-2 right-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                isAudiobook
                  ? "bg-bookmark-blue text-white"
                  : "bg-bookmark-green text-white"
              }`}
            >
              {isAudiobook ? (
                <>
                  <Headphones className="h-3 w-3" />
                  Sách nói
                </>
              ) : (
                <>
                  <BookOpen className="h-3 w-3" />
                  Ebook
                </>
              )}
            </span>
          </div>
        </div>
      </Link>

      <CardContent className="p-4">
        <Link href={`/books/${id}`}>
          <h3 className="font-semibold text-leather-800 line-clamp-2 hover:text-leather-600 transition-colors">
            {title}
          </h3>
        </Link>
        <p className="text-sm text-ink-500 mt-1">{author}</p>
        <p className="text-sm text-ink-400 mt-2 line-clamp-2">{description}</p>

        {isAudiobook && duration && (
          <div className="flex items-center gap-1 mt-2 text-xs text-ink-400">
            <Clock className="h-3 w-3" />
            {formatDuration(duration)}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <span className="text-lg font-bold text-leather-700">
          {formatPrice(price)}
        </span>
        <Link href={`/books/${id}`}>
          <Button size="sm">Xem chi tiết</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
