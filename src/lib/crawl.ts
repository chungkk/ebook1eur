/**
 * Crawler utility for ebook bestsellers
 * Supports: ebook.de, hugendubel.de
 * Used by admin API endpoint
 */

import * as fs from 'fs';
import * as path from 'path';

// Try to fetch page content with anti-bot headers
export async function fetchPageContent(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      next: { revalidate: 0 }
    });
    
    if (!response.ok) {
      console.error(`Fetch failed with status: ${response.status}`);
      return null;
    }
    
    const html = await response.text();
    
    // Check if we got blocked by security
    if (html.includes('Security Check') || html.includes('myrasecurity') || html.length < 10000) {
      console.error('Blocked by security check or content too short');
      return null;
    }
    
    return html;
  } catch (error) {
    console.error('Fetch error:', error);
    return null;
  }
}

// Auto crawl from source
export async function autoCrawl(sourceId: CrawlSource): Promise<CrawlResult | null> {
  const sourceInfo = CRAWL_SOURCES[sourceId];
  if (!sourceInfo) return null;
  
  console.log(`Auto-crawling ${sourceInfo.name} from ${sourceInfo.url}`);
  
  const html = await fetchPageContent(sourceInfo.url);
  if (!html) {
    console.error(`Failed to fetch content from ${sourceInfo.name}`);
    return null;
  }
  
  const books = parseContent(html, sourceId);
  if (books.length === 0) {
    console.error(`No books parsed from ${sourceInfo.name}`);
    return null;
  }
  
  const crawledAt = new Date().toISOString();
  return {
    source: `${sourceInfo.name} (auto)`,
    sourceId,
    crawledAt,
    totalBooks: books.length,
    books: books.map(b => ({ ...b, crawledAt }))
  };
}

export type CrawlSource = 'ebook-de' | 'hugendubel';

export interface CrawledBook {
  rank: number;
  title: string;
  author: string;
  price: string;
  url: string;
  crawledAt: string;
}

export interface CrawlResult {
  source: string;
  sourceId: CrawlSource;
  crawledAt: string;
  totalBooks: number;
  books: CrawledBook[];
}

export interface CrawlHistory {
  date: string;
  filename: string;
  totalBooks: number;
  source: string;
  sourceId: CrawlSource;
}

export const CRAWL_SOURCES: Record<CrawlSource, { name: string; url: string }> = {
  'ebook-de': {
    name: 'ebook.de',
    url: 'https://www.ebook.de/de/category/59006/ebook_de_bestseller.html'
  },
  'hugendubel': {
    name: 'Hugendubel',
    url: 'https://www.hugendubel.de/de/category/79379/ebook_bestseller.html'
  }
};

const DATA_DIR = path.join(process.cwd(), 'data', 'crawled');
const MANUAL_DIR = path.join(process.cwd(), 'data', 'manual');

// Parse content based on source
export function parseContent(content: string, sourceId: CrawlSource): Omit<CrawledBook, 'crawledAt'>[] {
  switch (sourceId) {
    case 'ebook-de':
      return parseEbookDeContent(content);
    case 'hugendubel':
      return parseHugendubelContent(content);
    default:
      return [];
  }
}

// Parse ebook.de content
export function parseEbookDeContent(content: string): Omit<CrawledBook, 'crawledAt'>[] {
  const books: Omit<CrawledBook, 'crawledAt'>[] = [];
  
  // Pattern: [Title](product_url) [Author](author_search_url)
  const pattern = /\[([^\]]+)\]\((https:\/\/www\.ebook\.de\/de\/product\/\d+\/[a-z0-9_]+\.html)\)[^\[]*\[([^\]]+)\]\(https:\/\/www\.ebook\.de\/de\/search\/advanced\?authors=/g;
  
  let match;
  let rank = 1;
  const seen = new Set<string>();
  
  while ((match = pattern.exec(content)) !== null) {
    const fullTitle = match[1];
    const url = match[2];
    const author = match[3];
    
    // Skip duplicates
    if (seen.has(url)) continue;
    seen.add(url);
    
    // Skip format variants
    if (fullTitle.match(/^(Taschenbuch|Hörbuch|Buch \(|CD|€)/)) continue;
    
    // Clean title
    const title = cleanTitle(fullTitle);
    if (!title || title.length < 2) continue;
    
    books.push({
      rank: rank++,
      title,
      author,
      price: '',
      url
    });
  }
  
  return books;
}

// Parse hugendubel.de content
export function parseHugendubelContent(content: string): Omit<CrawledBook, 'crawledAt'>[] {
  const books: Omit<CrawledBook, 'crawledAt'>[] = [];
  const seen = new Set<string>();
  let rank = 1;
  
  // Find all product URLs - match ](url) pattern
  const urlMatches = content.match(/\]\(https:\/\/www\.hugendubel\.de\/de\/ebook_epub\/[^)]+\)/g) || [];
  
  for (const urlMatch of urlMatches) {
    // Extract URL and product ID
    const url = urlMatch.slice(2, -1); // Remove ]( and )
    const productIdMatch = url.match(/-(\d+)-produkt-details/);
    if (!productIdMatch) continue;
    
    const productId = productIdMatch[1];
    if (seen.has(productId)) continue;
    seen.add(productId);
    
    // Find the [![ that precedes this URL
    const urlIndex = content.indexOf(urlMatch);
    const searchStart = Math.max(0, urlIndex - 1500);
    const searchArea = content.substring(searchStart, urlIndex);
    
    const imgStart = searchArea.lastIndexOf('[![');
    if (imgStart === -1) continue;
    
    // Extract title from [![Title]
    const afterImg = searchArea.substring(imgStart);
    const titleMatch = afterImg.match(/\[!\[([^\]]+)\]/);
    if (!titleMatch) continue;
    
    const fullTitle = titleMatch[1];
    
    // Skip format variants
    if (fullTitle.match(/^(Taschenbuch|Hörbuch|Buch \(|CD|€|\d+,\d+)/)) continue;
    
    // Find author - after image URL, split by two backslashes + newline pattern
    // First skip past the image URL: ](image_url)
    const imageEndMatch = afterImg.match(/\[!\[[^\]]+\]\([^)]+\)/);
    if (!imageEndMatch) continue;
    const textAfterImage = afterImg.substring(afterImg.indexOf(imageEndMatch[0]) + imageEndMatch[0].length);
    const parts = textAfterImage.split(/[\\]{2}\n[\\]{2}\n/);
    
    let author = '';
    for (let i = 1; i < parts.length && i < 6; i++) {
      const part = parts[i].trim();
      // Skip title repeat, band, rating, price, etc.
      if (part === fullTitle || part === titleMatch[1]) continue;
      if (part.includes(fullTitle)) continue; // Skip if contains title
      if (/^Band \d+$/.test(part)) continue;
      if (/^\(\d+\)$/.test(part)) continue;
      if (/^15$/.test(part)) continue;
      if (/^\d+,\d+\s*€/.test(part)) continue;
      if (/^Statt/.test(part)) continue;
      if (/\|/.test(part)) continue; // Skip subtitle parts
      if (part.length < 3) continue;
      
      author = part;
      break;
    }
    
    if (!author || author.length < 2) continue;
    
    const title = cleanTitle(fullTitle);
    if (!title || title.length < 2) continue;
    
    books.push({
      rank: rank++,
      title,
      author,
      price: '',
      url
    });
  }
  
  return books;
}

// Helper to clean title
function cleanTitle(fullTitle: string): string {
  return fullTitle
    .split(':')[0]
    .split('|')[0]
    .replace(/\\n/g, ' ')
    .replace(/\\$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Get latest crawl result for a source
export function getLatestCrawl(sourceId: CrawlSource = 'ebook-de'): CrawlResult | null {
  const latestPath = path.join(DATA_DIR, `${sourceId}-bestsellers-latest.json`);
  
  if (!fs.existsSync(latestPath)) {
    return null;
  }
  
  try {
    const content = fs.readFileSync(latestPath, 'utf-8');
    return JSON.parse(content) as CrawlResult;
  } catch {
    return null;
  }
}

// Get all latest crawl results
export function getAllLatestCrawls(): Record<CrawlSource, CrawlResult | null> {
  return {
    'ebook-de': getLatestCrawl('ebook-de'),
    'hugendubel': getLatestCrawl('hugendubel')
  };
}

// Get crawl history for all sources
export function getCrawlHistory(): CrawlHistory[] {
  if (!fs.existsSync(DATA_DIR)) {
    return [];
  }
  
  const files = fs.readdirSync(DATA_DIR)
    .filter(f => f.match(/^(ebook-de|hugendubel)-bestsellers-\d{4}-\d{2}\.json$/))
    .sort()
    .reverse();
  
  return files.map(filename => {
    const filepath = path.join(DATA_DIR, filename);
    try {
      const content = fs.readFileSync(filepath, 'utf-8');
      const data = JSON.parse(content) as CrawlResult;
      const dateMatch = filename.match(/(\d{4}-\d{2})/);
      const sourceMatch = filename.match(/^(ebook-de|hugendubel)/);
      return {
        date: dateMatch ? dateMatch[1] : '',
        filename,
        totalBooks: data.totalBooks,
        source: data.source,
        sourceId: (sourceMatch?.[1] || 'ebook-de') as CrawlSource
      };
    } catch {
      return {
        date: '',
        filename,
        totalBooks: 0,
        source: 'unknown',
        sourceId: 'ebook-de' as CrawlSource
      };
    }
  }).filter(h => h.date);
}

// Save crawl result
export function saveCrawlResult(result: CrawlResult): string {
  // Ensure output directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  const sourceId = result.sourceId;
  
  // Generate filename with date
  const date = new Date();
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const filename = `${sourceId}-bestsellers-${dateStr}.json`;
  const filepath = path.join(DATA_DIR, filename);
  
  // Save full result
  fs.writeFileSync(filepath, JSON.stringify(result, null, 2), 'utf-8');
  
  // Update latest version
  const latestPath = path.join(DATA_DIR, `${sourceId}-bestsellers-latest.json`);
  fs.writeFileSync(latestPath, JSON.stringify(result, null, 2), 'utf-8');
  
  // Save CSV
  const csvPath = path.join(DATA_DIR, `${sourceId}-bestsellers-${dateStr}.csv`);
  const csvContent = [
    'Rank,Title,Author,Price,URL',
    ...result.books.map(b => 
      `${b.rank},"${b.title.replace(/"/g, '""')}","${b.author.replace(/"/g, '""')}","${b.price}","${b.url}"`
    )
  ].join('\n');
  fs.writeFileSync(csvPath, csvContent, 'utf-8');
  
  return filename;
}

// Process manual upload
export function processManualUpload(htmlContent: string, sourceId: CrawlSource): CrawlResult | null {
  const books = parseContent(htmlContent, sourceId);
  
  if (books.length === 0) {
    return null;
  }
  
  const crawledAt = new Date().toISOString();
  const sourceName = CRAWL_SOURCES[sourceId].name;
  
  return {
    source: `${sourceName} (manual upload)`,
    sourceId,
    crawledAt,
    totalBooks: books.length,
    books: books.map(b => ({ ...b, crawledAt }))
  };
}

// Check if manual file exists
export function hasManualFile(): boolean {
  return fs.existsSync(path.join(MANUAL_DIR, 'ebook-de.html'));
}

// Get manual file path
export function getManualFilePath(): string {
  return path.join(MANUAL_DIR, 'ebook-de.html');
}
