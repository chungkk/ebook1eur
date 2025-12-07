import Image from "next/image";
import Link from "next/link";
import { BookOpen, Headphones, Clock, Wrench } from "lucide-react";
import { Card } from "@/components/ui/card";
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
    <Card className="group overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 flex flex-col h-full bg-white">
      <Link href={`/books/${id}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-parchment-100">
          <Image
            src={coverImage}
            alt={title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
          />
          <div className="absolute top-2 right-2">
            <span
              className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium shadow-sm ${
                isAudiobook
                  ? "bg-bookmark-blue text-white"
                  : "bg-bookmark-green text-white"
              }`}
            >
              {isAudiobook ? (
                <>
                  <Headphones className="h-3 w-3" />
                  Hörbuch
                </>
              ) : (
                <>
                  <BookOpen className="h-3 w-3" />
                  E-Book
                </>
              )}
            </span>
          </div>
          {isAudiobook && (
            <div className="absolute top-10 right-2">
              <span className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium bg-orange-500 text-white shadow-sm">
                <Wrench className="h-3 w-3" />
                Wartung
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-3 flex flex-col flex-1">
        <Link href={`/books/${id}`}>
          <h3 className="font-semibold text-sm text-leather-800 line-clamp-1 hover:text-leather-600 transition-colors">
            {title}
          </h3>
        </Link>
        <p className="text-xs text-ink-500 mt-0.5 line-clamp-1">{author}</p>
        <p className="text-xs text-ink-400 mt-1 line-clamp-2 hidden sm:block flex-1">{description}</p>

        {isAudiobook && duration && (
          <div className="flex items-center gap-1 mt-1 text-xs text-ink-400">
            <Clock className="h-3 w-3" />
            {formatDuration(duration)}
          </div>
        )}

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-parchment-200">
          <span className="text-sm font-bold text-leather-700">
            {formatPrice(price)}
          </span>
          <Link href={`/books/${id}`}>
            <Button size="sm" variant="default" className="text-xs h-7 px-2">
              Details ansehen
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
