"use client";

import { useState, useCallback, useEffect } from "react";
import { ReactReader } from "react-reader";
import type { Contents, Rendition } from "epubjs";
import { Sun, Moon, Minus, Plus, X, Menu, Loader2 } from "lucide-react";

interface EpubReaderProps {
  url: string | ArrayBuffer;
  title: string;
  onClose?: () => void;
}

type Theme = "light" | "dark" | "sepia";

const themes: Record<Theme, { body: Record<string, string> }> = {
  light: {
    body: {
      background: "#ffffff",
      color: "#1a1a1a",
    },
  },
  dark: {
    body: {
      background: "#1a1a1a",
      color: "#e0e0e0",
    },
  },
  sepia: {
    body: {
      background: "#f4ecd8",
      color: "#5b4636",
    },
  },
};

const STORAGE_KEY_PREFIX = "epub-reader-location-";

interface PageInfo {
  currentPage: number;
  totalPages: number;
  percentage: number;
  chapterName?: string;
}

export default function EpubReader({ url, title, onClose }: EpubReaderProps) {
  const [mounted, setMounted] = useState(false);
  const [location, setLocation] = useState<string | number>(0);
  const [fontSize, setFontSize] = useState(100);
  const [theme, setTheme] = useState<Theme>("light");
  const [showToc, setShowToc] = useState(false);
  const [rendition, setRendition] = useState<Rendition | null>(null);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);

  // Use title as storage key since url might be ArrayBuffer
  const storageKey = STORAGE_KEY_PREFIX + title;

  // Ensure component only renders on client to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const locationChanged = useCallback(
    (epubcfi: string) => {
      setLocation(epubcfi);
      // Save location to localStorage
      if (typeof window !== "undefined" && title) {
        localStorage.setItem(storageKey, epubcfi);
      }
    },
    [title, storageKey]
  );

  const getStoredLocation = useCallback(() => {
    if (typeof window !== "undefined" && title) {
      return localStorage.getItem(storageKey);
    }
    return null;
  }, [title, storageKey]);

  const handleRendition = useCallback(
    (rend: Rendition) => {
      setRendition(rend);
      
      // Apply initial theme
      rend.themes.register("light", themes.light);
      rend.themes.register("dark", themes.dark);
      rend.themes.register("sepia", themes.sepia);
      rend.themes.select(theme);

      // Apply initial font size
      rend.themes.fontSize(`${fontSize}%`);

      // Restore saved location
      const saved = getStoredLocation();
      if (saved) {
        rend.display(saved);
      }

      // Generate locations first, then handle page tracking
      rend.book.ready.then(async () => {
        // Generate fine-grained locations for accurate tracking
        await rend.book.locations.generate(1024);
        
        const totalLocations = rend.book.locations.length();
        // Calculate a reasonable page count (~250-400 pages for most books)
        // Normalize based on typical book having ~300 pages
        const targetPagesPerBook = Math.max(100, Math.min(500, Math.round(totalLocations / 3)));
        
        // Handle page tracking after locations are ready
        rend.on("relocated", (loc: { 
          start: { cfi: string; displayed: { page: number; total: number } }; 
          atEnd: boolean;
          atStart: boolean;
        }) => {
          setLocation(loc.start.cfi);
          
          const currentLocation = rend.book.locations.locationFromCfi(loc.start.cfi) as unknown as number;
          const percentage = totalLocations > 0 
            ? Math.round((currentLocation / totalLocations) * 100) 
            : 0;
          
          // Calculate normalized page number
          const currentPage = Math.max(1, Math.round((currentLocation / totalLocations) * targetPagesPerBook));
          
          setPageInfo({
            currentPage: Math.min(currentPage, targetPagesPerBook),
            totalPages: targetPagesPerBook,
            percentage: isNaN(percentage) ? 0 : percentage,
          });
        });
        
        // Trigger initial relocated event
        const currentLoc = rend.currentLocation();
        if (currentLoc) {
          rend.display(currentLoc.start.cfi);
        }
      });
    },
    [theme, fontSize, getStoredLocation]
  );

  const changeFontSize = (delta: number) => {
    const newSize = Math.max(50, Math.min(200, fontSize + delta));
    setFontSize(newSize);
    if (rendition) {
      rendition.themes.fontSize(`${newSize}%`);
    }
  };

  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    if (rendition) {
      rendition.themes.select(newTheme);
    }
  };

  const bgColors: Record<Theme, string> = {
    light: "bg-white",
    dark: "bg-[#1a1a1a]",
    sepia: "bg-[#f4ecd8]",
  };

  const textColors: Record<Theme, string> = {
    light: "text-gray-900",
    dark: "text-gray-100",
    sepia: "text-[#5b4636]",
  };

  // Show loading state until client-side mounted
  if (!mounted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${bgColors[theme]}`}>
      {/* Header */}
      <div
        className={`flex items-center justify-between px-4 py-3 border-b ${
          theme === "dark"
            ? "border-gray-700 bg-gray-900"
            : theme === "sepia"
            ? "border-[#d4c4a8] bg-[#e8dcc8]"
            : "border-gray-200 bg-gray-50"
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowToc(!showToc)}
            className={`p-2 rounded-lg transition-colors ${
              theme === "dark"
                ? "hover:bg-gray-800 text-gray-300"
                : "hover:bg-gray-200 text-gray-600"
            }`}
            title="Mục lục"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className={`font-medium truncate max-w-xs ${textColors[theme]}`}>
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Font size controls */}
          <div className="flex items-center gap-1 mr-2">
            <button
              onClick={() => changeFontSize(-10)}
              className={`p-2 rounded-lg transition-colors ${
                theme === "dark"
                  ? "hover:bg-gray-800 text-gray-300"
                  : "hover:bg-gray-200 text-gray-600"
              }`}
              title="Giảm cỡ chữ"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className={`text-sm w-12 text-center ${textColors[theme]}`}>
              {fontSize}%
            </span>
            <button
              onClick={() => changeFontSize(10)}
              className={`p-2 rounded-lg transition-colors ${
                theme === "dark"
                  ? "hover:bg-gray-800 text-gray-300"
                  : "hover:bg-gray-200 text-gray-600"
              }`}
              title="Tăng cỡ chữ"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Theme buttons */}
          <button
            onClick={() => changeTheme("light")}
            className={`p-2 rounded-lg transition-colors ${
              theme === "light"
                ? "bg-yellow-100 text-yellow-600"
                : theme === "dark"
                ? "hover:bg-gray-800 text-gray-400"
                : "hover:bg-[#d4c4a8] text-[#8b7355]"
            }`}
            title="Chế độ sáng"
          >
            <Sun className="h-5 w-5" />
          </button>
          <button
            onClick={() => changeTheme("sepia")}
            className={`p-2 rounded-lg transition-colors ${
              theme === "sepia"
                ? "bg-[#d4c4a8] text-[#5b4636]"
                : theme === "dark"
                ? "hover:bg-gray-800 text-gray-400"
                : "hover:bg-gray-200 text-gray-600"
            }`}
            title="Chế độ sepia"
          >
            <span className="w-5 h-5 flex items-center justify-center text-sm font-bold">
              S
            </span>
          </button>
          <button
            onClick={() => changeTheme("dark")}
            className={`p-2 rounded-lg transition-colors ${
              theme === "dark"
                ? "bg-gray-700 text-blue-400"
                : "hover:bg-gray-200 text-gray-600"
            }`}
            title="Chế độ tối"
          >
            <Moon className="h-5 w-5" />
          </button>

          {/* Close button */}
          {onClose && (
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ml-2 ${
                theme === "dark"
                  ? "hover:bg-gray-800 text-gray-300"
                  : "hover:bg-gray-200 text-gray-600"
              }`}
              title="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Reader */}
      <div className="flex-1 relative">
        <ReactReader
          url={url}
          location={location}
          locationChanged={locationChanged}
          getRendition={handleRendition}
          showToc={showToc}
          tocChanged={() => setShowToc(false)}
          epubOptions={{
            flow: "paginated",
            manager: "continuous",
          }}
        />
      </div>

      {/* Footer with page info */}
      <div
        className={`flex items-center justify-center px-4 py-2 border-t ${
          theme === "dark"
            ? "border-gray-700 bg-gray-900"
            : theme === "sepia"
            ? "border-[#d4c4a8] bg-[#e8dcc8]"
            : "border-gray-200 bg-gray-50"
        }`}
      >
        {pageInfo ? (
          <div className={`flex items-center gap-4 text-sm ${textColors[theme]}`}>
            <span>
              Trang {pageInfo.currentPage} / {pageInfo.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <div className={`w-24 h-1.5 rounded-full ${
                theme === "dark" ? "bg-gray-700" : "bg-gray-200"
              }`}>
                <div 
                  className="h-full rounded-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${pageInfo.percentage}%` }}
                />
              </div>
              <span className="text-xs opacity-70">{pageInfo.percentage}%</span>
            </div>
          </div>
        ) : (
          <span className={`text-sm opacity-50 ${textColors[theme]}`}>
            Đang tải...
          </span>
        )}
      </div>
    </div>
  );
}
