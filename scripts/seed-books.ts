/**
 * Seed Sample Books Script
 * 
 * Usage:
 *   npx tsx scripts/seed-books.ts
 */

import mongoose from "mongoose";
import "dotenv/config";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI environment variable is not set");
  process.exit(1);
}

const BookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  author: { type: String, required: true },
  type: { type: String, enum: ["ebook", "audiobook"], required: true },
  price: { type: Number, required: true },
  duration: { type: Number },
  coverImage: { type: String, required: true },
  filePath: { type: String, required: true },
  fileSize: { type: Number, required: true },
  status: { type: String, enum: ["active", "deleted"], default: "active" },
}, { timestamps: true });

const Book = mongoose.models.Book || mongoose.model("Book", BookSchema);

const sampleBooks = [
  {
    title: "Đắc Nhân Tâm",
    description: "Đắc nhân tâm của Dale Carnegie là cuốn sách nổi tiếng nhất, bán chạy nhất và có tầm ảnh hưởng nhất của mọi thời đại. Tác phẩm đã được chuyển ngữ sang hầu hết các thứ tiếng trên thế giới và có mặt ở hàng trăm quốc gia.",
    author: "Dale Carnegie",
    type: "ebook",
    price: 1,
    coverImage: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400",
    filePath: "books/dac-nhan-tam.pdf",
    fileSize: 2500000,
  },
  {
    title: "Nhà Giả Kim",
    description: "Tất cả những trải nghiệm trong chuyến phiêu du theo đuổi vận mệnh của mình đã giúp Santiago thấu hiểu được ý nghĩa sâu xa nhất của hạnh phúc, hòa hợp với vũ trụ và con người.",
    author: "Paulo Coelho",
    type: "ebook",
    price: 1,
    coverImage: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400",
    filePath: "books/nha-gia-kim.epub",
    fileSize: 1800000,
  },
  {
    title: "Sapiens: Lược Sử Loài Người",
    description: "Sapiens đưa bạn đi ngược dòng lịch sử để khám phá những bước ngoặt quan trọng trong hành trình tiến hóa của loài người, từ thời kỳ đồ đá cho đến thế kỷ 21.",
    author: "Yuval Noah Harari",
    type: "audiobook",
    price: 1,
    duration: 720,
    coverImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    filePath: "books/sapiens.mp3",
    fileSize: 450000000,
  },
  {
    title: "Atomic Habits",
    description: "Cuốn sách sẽ thay đổi cách bạn nghĩ về tiến bộ và thành công, và cung cấp cho bạn các công cụ và chiến lược bạn cần để thay đổi thói quen của mình.",
    author: "James Clear",
    type: "ebook",
    price: 1,
    coverImage: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400",
    filePath: "books/atomic-habits.pdf",
    fileSize: 3200000,
  },
  {
    title: "Thinking, Fast and Slow",
    description: "Daniel Kahneman đưa người đọc vào một cuộc hành trình mang tính đột phá qua tâm trí và giải thích hai hệ thống thúc đẩy cách chúng ta suy nghĩ.",
    author: "Daniel Kahneman",
    type: "audiobook",
    price: 1,
    duration: 1200,
    coverImage: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400",
    filePath: "books/thinking-fast-slow.mp3",
    fileSize: 680000000,
  },
  {
    title: "Tuổi Trẻ Đáng Giá Bao Nhiêu",
    description: "Cuốn sách là những chia sẻ của tác giả Rosie Nguyễn về hành trình trưởng thành, những bài học cuộc sống và cách tận dụng tuổi trẻ một cách có ý nghĩa.",
    author: "Rosie Nguyễn",
    type: "ebook",
    price: 1,
    coverImage: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400",
    filePath: "books/tuoi-tre-dang-gia.pdf",
    fileSize: 1500000,
  },
  {
    title: "Cà Phê Cùng Tony",
    description: "Những câu chuyện nhẹ nhàng, sâu sắc về cuộc sống, tình yêu và những bài học quý giá được Tony Buổi Sáng chia sẻ qua từng trang sách.",
    author: "Tony Buổi Sáng",
    type: "audiobook",
    price: 1,
    duration: 480,
    coverImage: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400",
    filePath: "books/ca-phe-cung-tony.mp3",
    fileSize: 320000000,
  },
  {
    title: "Deep Work",
    description: "Cal Newport khẳng định rằng làm việc sâu là khả năng tập trung mà không bị phân tâm vào một nhiệm vụ đòi hỏi nhận thức cao.",
    author: "Cal Newport",
    type: "ebook",
    price: 1,
    coverImage: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400",
    filePath: "books/deep-work.epub",
    fileSize: 2100000,
  },
];

async function seedBooks() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected successfully");

  // Check existing books
  const existingCount = await Book.countDocuments();
  if (existingCount > 0) {
    console.log(`Database already has ${existingCount} books.`);
    const answer = process.argv.includes("--force");
    if (!answer) {
      console.log("Use --force to add more books anyway.");
      await mongoose.disconnect();
      return;
    }
  }

  console.log("\nSeeding sample books...");
  
  for (const book of sampleBooks) {
    const existing = await Book.findOne({ title: book.title });
    if (existing) {
      console.log(`  Skip: "${book.title}" already exists`);
      continue;
    }
    
    await Book.create(book);
    console.log(`  ✓ Created: "${book.title}" (${book.type})`);
  }

  const totalCount = await Book.countDocuments();
  console.log(`\n✓ Seeding complete! Total books: ${totalCount}`);

  await mongoose.disconnect();
}

seedBooks().catch((error) => {
  console.error("Error seeding books:", error);
  process.exit(1);
});
