// Script to parse ebook.de bestseller data from fetched content
// Usage: npx ts-node scripts/crawl-ebook-de.ts <path-to-fetched-file>

import * as fs from 'fs';

interface Book {
  rank: number;
  title: string;
  author: string;
  url: string;
}

function parseEbookDeBestsellers(content: string): Book[] {
  const books: Book[] = [];
  
  // Pattern: [Title](product_url) [Author](author_search_url)
  // Main books have author name in the product URL like: /product/123/author_name_title.html
  const pattern = /\[([^\]]+)\]\((https:\/\/www\.ebook\.de\/de\/product\/\d+\/[a-z_]+\.html)\)\s*\[([^\]]+)\]\(https:\/\/www\.ebook\.de\/de\/search\/advanced\?authors=/g;
  
  let match;
  let rank = 1;
  
  while ((match = pattern.exec(content)) !== null) {
    const fullTitle = match[1];
    const url = match[2];
    const author = match[3];
    
    // Skip if it's a format variant (Taschenbuch, Hörbuch, etc.)
    if (fullTitle.match(/^(Taschenbuch|Hörbuch|Buch \(|CD)/)) {
      continue;
    }
    
    // Clean title - remove subtitle after : or |
    const title = fullTitle
      .split(':')[0]
      .split('|')[0]
      .replace(/\\n/g, ' ')
      .replace(/\\$/g, '')  // Remove trailing backslash
      .replace(/\s+/g, ' ')
      .trim();
    
    books.push({
      rank: rank++,
      title,
      author,
      url
    });
  }
  
  return books;
}

async function main() {
  // Read from artifact file or stdin
  const filePath = process.argv[2] || '/Users/chungkk/.factory/artifacts/tool-outputs/fetch_url-toolu_01KQQ6K7otEUaQbQ3hrwyjkq-95761964.log';
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const books = parseEbookDeBestsellers(content);
  
  console.log(`Found ${books.length} books:\n`);
  console.log('Rank | Title | Author');
  console.log('-----|-------|-------');
  
  books.forEach(book => {
    console.log(`${book.rank} | ${book.title} | ${book.author}`);
  });
  
  // Save to JSON
  const outputPath = 'scripts/ebook-de-bestsellers.json';
  fs.writeFileSync(outputPath, JSON.stringify(books, null, 2), 'utf-8');
  console.log(`\nSaved to ${outputPath}`);
}

main().catch(console.error);
