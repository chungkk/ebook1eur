#!/usr/bin/env npx ts-node
/**
 * Monthly crawler for ebook.de bestsellers
 * 
 * Usage:
 *   npm run crawl:ebooks              # Try auto-crawl, fallback to manual
 *   npm run crawl:ebooks -- --manual  # Parse from manual HTML file
 *   npm run crawl:ebooks -- --url URL # Parse from URL (using fetch)
 * 
 * Manual mode: Save page source from browser to data/manual/ebook-de.html
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as fs from 'fs';
import * as path from 'path';

puppeteer.use(StealthPlugin());

const MANUAL_FILE = path.join(process.cwd(), 'data', 'manual', 'ebook-de.html');

interface Book {
  rank: number;
  title: string;
  author: string;
  price: string;
  url: string;
  crawledAt: string;
}

interface CrawlResult {
  source: string;
  crawledAt: string;
  totalBooks: number;
  books: Book[];
}

const BESTSELLER_URL = 'https://www.ebook.de/de/category/59006/ebook_de_bestseller.html';
const OUTPUT_DIR = path.join(process.cwd(), 'data', 'crawled');

async function crawlEbookDeBestsellers(): Promise<CrawlResult> {
  console.log('🚀 Starting ebook.de crawler...');
  console.log(`📅 Date: ${new Date().toISOString()}`);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-infobars',
      '--window-size=1920,1080'
    ]
  });
  
  const page = await browser.newPage();
  
  // Set realistic user agent
  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );
  
  // Set viewport
  await page.setViewport({ width: 1920, height: 1080 });
  
  console.log(`📖 Navigating to: ${BESTSELLER_URL}`);
  
  try {
    await page.goto(BESTSELLER_URL, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    
    // Wait for page to fully load
    await page.waitForFunction(() => document.readyState === 'complete', { timeout: 30000 });
    
    // Wait a bit for dynamic content
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Save screenshot for debugging
    const debugDir = path.join(process.cwd(), 'data', 'debug');
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true });
    }
    await page.screenshot({ path: path.join(debugDir, 'ebook-de-page.png'), fullPage: true });
    console.log('📸 Debug screenshot saved');
    
    // Check if we hit a security check page
    const pageContent = await page.content();
    if (pageContent.includes('Security Check') || pageContent.includes('myrasecurity')) {
      console.log('⚠️  Security check detected, waiting longer...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      await page.screenshot({ path: path.join(debugDir, 'ebook-de-after-wait.png'), fullPage: true });
    }
    
    // Scroll to load all items
    await autoScroll(page);
    
    // Save HTML for debugging
    const htmlContent = await page.content();
    fs.writeFileSync(path.join(debugDir, 'ebook-de-page.html'), htmlContent, 'utf-8');
    console.log('📄 Debug HTML saved');
    
    console.log('📊 Extracting book data...');
    
    const books = await page.evaluate(() => {
      const results: Omit<Book, 'crawledAt'>[] = [];
      
      // Find all product containers
      const productLinks = document.querySelectorAll('a[href*="/de/product/"]');
      const seen = new Set<string>();
      let rank = 1;
      
      productLinks.forEach((link) => {
        const href = link.getAttribute('href') || '';
        
        // Skip non-book links (formats like Hörbuch, Taschenbuch)
        if (!href.includes('/product/') || seen.has(href)) return;
        if (href.match(/\.(html)$/) === null) return;
        
        // Get the product card container
        const container = link.closest('div[class*="product"]') || link.parentElement?.parentElement;
        if (!container) return;
        
        // Extract title from link text or image alt
        const titleEl = container.querySelector('a[href*="/product/"] > span, a[href*="/product/"]');
        let title = titleEl?.textContent?.trim() || '';
        
        // Skip if title looks like a format
        if (title.match(/^(Taschenbuch|Hörbuch|Buch \(|CD|€)/)) return;
        if (!title || title.length < 2) return;
        
        // Clean title
        title = title.split(':')[0].split('|')[0].trim();
        
        // Extract author
        const authorLink = container.querySelector('a[href*="authors="]');
        const author = authorLink?.textContent?.trim() || 'Unknown';
        
        // Extract price
        const priceEl = container.querySelector('[class*="price"], span:contains("€")');
        const price = priceEl?.textContent?.match(/[\d,]+\s*€/)?.[0] || '';
        
        // Build full URL
        const fullUrl = href.startsWith('http') ? href : `https://www.ebook.de${href}`;
        
        // Avoid duplicates
        if (seen.has(fullUrl)) return;
        seen.add(fullUrl);
        
        results.push({
          rank: rank++,
          title,
          author,
          price,
          url: fullUrl
        });
      });
      
      return results;
    });
    
    await browser.close();
    
    const crawledAt = new Date().toISOString();
    const booksWithTimestamp = books.map(book => ({ ...book, crawledAt }));
    
    console.log(`✅ Found ${booksWithTimestamp.length} books`);
    
    return {
      source: 'ebook.de',
      crawledAt,
      totalBooks: booksWithTimestamp.length,
      books: booksWithTimestamp
    };
    
  } catch (error) {
    await browser.close();
    throw error;
  }
}

async function autoScroll(page: puppeteer.Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 500;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
      
      // Max 30 seconds of scrolling
      setTimeout(() => {
        clearInterval(timer);
        resolve();
      }, 30000);
    });
  });
}

function saveResults(result: CrawlResult): string {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // Generate filename with date
  const date = new Date();
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const filename = `ebook-de-bestsellers-${dateStr}.json`;
  const filepath = path.join(OUTPUT_DIR, filename);
  
  // Save full result
  fs.writeFileSync(filepath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`💾 Saved to: ${filepath}`);
  
  // Also save latest version
  const latestPath = path.join(OUTPUT_DIR, 'ebook-de-bestsellers-latest.json');
  fs.writeFileSync(latestPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`💾 Updated: ${latestPath}`);
  
  // Save simple CSV for easy viewing
  const csvPath = path.join(OUTPUT_DIR, `ebook-de-bestsellers-${dateStr}.csv`);
  const csvContent = [
    'Rank,Title,Author,Price,URL',
    ...result.books.map(b => 
      `${b.rank},"${b.title.replace(/"/g, '""')}","${b.author.replace(/"/g, '""')}","${b.price}","${b.url}"`
    )
  ].join('\n');
  fs.writeFileSync(csvPath, csvContent, 'utf-8');
  console.log(`📄 CSV saved: ${csvPath}`);
  
  return filepath;
}

// Parse HTML content to extract books
function parseHtmlContent(html: string): Omit<Book, 'crawledAt'>[] {
  const books: Omit<Book, 'crawledAt'>[] = [];
  
  // Pattern: [Title](product_url) [Author](author_search_url)
  const pattern = /\[([^\]]+)\]\((https:\/\/www\.ebook\.de\/de\/product\/\d+\/[a-z0-9_]+\.html)\)[^\[]*\[([^\]]+)\]\(https:\/\/www\.ebook\.de\/de\/search\/advanced\?authors=/g;
  
  let match;
  let rank = 1;
  const seen = new Set<string>();
  
  while ((match = pattern.exec(html)) !== null) {
    const fullTitle = match[1];
    const url = match[2];
    const author = match[3];
    
    // Skip duplicates
    if (seen.has(url)) continue;
    seen.add(url);
    
    // Skip format variants
    if (fullTitle.match(/^(Taschenbuch|Hörbuch|Buch \(|CD|€)/)) continue;
    
    // Clean title
    const title = fullTitle
      .split(':')[0]
      .split('|')[0]
      .replace(/\\n/g, ' ')
      .replace(/\\$/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
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

// Try to crawl from manual file
async function crawlFromManualFile(): Promise<CrawlResult | null> {
  if (!fs.existsSync(MANUAL_FILE)) {
    return null;
  }
  
  console.log(`📂 Reading from manual file: ${MANUAL_FILE}`);
  const html = fs.readFileSync(MANUAL_FILE, 'utf-8');
  const books = parseHtmlContent(html);
  
  if (books.length === 0) return null;
  
  const crawledAt = new Date().toISOString();
  return {
    source: 'ebook.de (manual)',
    crawledAt,
    totalBooks: books.length,
    books: books.map(b => ({ ...b, crawledAt }))
  };
}

async function main() {
  const args = process.argv.slice(2);
  const isManual = args.includes('--manual');
  
  try {
    let result: CrawlResult | null = null;
    
    if (isManual) {
      // Manual mode only
      result = await crawlFromManualFile();
      if (!result) {
        console.error(`❌ Manual file not found: ${MANUAL_FILE}`);
        console.log('\n📋 Instructions:');
        console.log('1. Open https://www.ebook.de/de/category/59006/ebook_de_bestseller.html in browser');
        console.log('2. Right-click → "View Page Source" or Ctrl+U');
        console.log('3. Save the HTML to: data/manual/ebook-de.html');
        console.log('4. Run this script again with --manual');
        process.exit(1);
      }
    } else {
      // Try auto-crawl first
      console.log('🤖 Attempting auto-crawl...');
      result = await crawlEbookDeBestsellers();
      
      // Fallback to manual if auto-crawl fails
      if (!result || result.books.length === 0) {
        console.log('\n⚠️  Auto-crawl failed (security block). Trying manual file...');
        result = await crawlFromManualFile();
        
        if (!result) {
          console.error('\n❌ No data available.');
          console.log('\n📋 To update data manually:');
          console.log('1. Open https://www.ebook.de/de/category/59006/ebook_de_bestseller.html');
          console.log('2. Save page source to: data/manual/ebook-de.html');
          console.log('3. Run: npm run crawl:ebooks -- --manual');
          process.exit(1);
        }
      }
    }
    
    saveResults(result);
    
    // Print summary
    console.log('\n📚 Top 10 Bestsellers:');
    console.log('─'.repeat(60));
    result.books.slice(0, 10).forEach(book => {
      console.log(`${book.rank}. ${book.title} - ${book.author}`);
    });
    
    console.log('\n✨ Crawl completed successfully!');
    
  } catch (error) {
    console.error('❌ Crawl failed:', error);
    process.exit(1);
  }
}

main();
