import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getAllLatestCrawls,
  getCrawlHistory,
  processManualUpload,
  saveCrawlResult,
  CRAWL_SOURCES,
  type CrawlSource,
} from "@/lib/crawl";

// GET: Get crawl status and history
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const latestAll = getAllLatestCrawls();
    const history = getCrawlHistory();

    // Format latest results
    const latest = Object.entries(latestAll).reduce((acc, [sourceId, data]) => {
      acc[sourceId as CrawlSource] = data
        ? {
            source: data.source,
            sourceId: data.sourceId,
            crawledAt: data.crawledAt,
            totalBooks: data.totalBooks,
            topBooks: data.books.slice(0, 10),
          }
        : null;
      return acc;
    }, {} as Record<CrawlSource, unknown>);

    return NextResponse.json({
      success: true,
      data: {
        sources: CRAWL_SOURCES,
        latest,
        history,
      },
    });
  } catch (error) {
    console.error("Error getting crawl status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get crawl status" },
      { status: 500 }
    );
  }
}

// POST: Process manual HTML upload
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { htmlContent, sourceId } = body;

    if (!htmlContent || typeof htmlContent !== "string") {
      return NextResponse.json(
        { success: false, error: "HTML content is required" },
        { status: 400 }
      );
    }

    // Validate sourceId
    const validSourceId: CrawlSource = 
      sourceId && (sourceId === 'ebook-de' || sourceId === 'hugendubel') 
        ? sourceId 
        : 'ebook-de';

    const result = processManualUpload(htmlContent, validSourceId);

    if (!result || result.books.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No books found in the provided HTML content. Make sure you selected the correct source.",
        },
        { status: 400 }
      );
    }

    const filename = saveCrawlResult(result);

    return NextResponse.json({
      success: true,
      data: {
        filename,
        sourceId: validSourceId,
        totalBooks: result.totalBooks,
        crawledAt: result.crawledAt,
        topBooks: result.books.slice(0, 5),
      },
    });
  } catch (error) {
    console.error("Error processing crawl:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process crawl data" },
      { status: 500 }
    );
  }
}
