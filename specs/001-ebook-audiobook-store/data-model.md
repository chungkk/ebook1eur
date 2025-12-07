# Data Model: Ebook1eur

**Database**: MongoDB  
**ODM**: Mongoose

## Collections

### User

```typescript
interface User {
  _id: ObjectId;
  email: string;              // unique, required, lowercase
  passwordHash: string;       // bcrypt hash
  name: string;               // display name
  role: 'user' | 'admin';     // default: 'user'
  status: 'active' | 'blocked'; // default: 'active'
  emailVerified: boolean;     // default: false
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
- email: unique
- role: 1 (for admin queries)
- status: 1
```

**Validation Rules**:
- email: valid email format, unique
- passwordHash: min 60 chars (bcrypt output)
- name: 1-100 chars

**State Transitions**:
- `active` → `blocked` (admin action)
- `blocked` → `active` (admin action)

---

### Book

```typescript
interface Book {
  _id: ObjectId;
  title: string;              // required, 1-200 chars
  description: string;        // required, max 5000 chars
  author: string;             // required, 1-100 chars
  type: 'ebook' | 'audiobook'; // required
  duration?: number;          // seconds, required if audiobook
  price: number;              // EUR, default: 1.00
  coverImage: string;         // GCS URL
  filePath: string;           // GCS path (not public URL)
  fileSize: number;           // bytes
  status: 'active' | 'deleted'; // soft delete
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
- type: 1, status: 1 (for catalog queries)
- status: 1, createdAt: -1 (for listing)
- title: text, author: text (for search)
```

**Validation Rules**:
- title: required, 1-200 chars
- description: required, max 5000 chars
- author: required, 1-100 chars
- duration: required if type === 'audiobook', min 1
- price: min 0, default 1.00
- fileSize: max 2GB (2147483648 bytes)

**State Transitions**:
- `active` → `deleted` (admin soft delete)
- `deleted` → `active` (admin restore, if implemented)

---

### Purchase

```typescript
interface Purchase {
  _id: ObjectId;
  userId: ObjectId;           // ref: User
  bookId: ObjectId;           // ref: Book
  amount: number;             // EUR paid
  paymentMethod: 'stripe' | 'paypal';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentId: string;          // Stripe/PayPal transaction ID
  purchaseMonth: string;      // YYYY-MM format for quota tracking
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
- userId: 1, createdAt: -1 (for user history)
- userId: 1, purchaseMonth: 1, paymentStatus: 1 (for quota check)
- paymentId: unique (for webhook idempotency)
- bookId: 1 (for book stats)
```

**Validation Rules**:
- amount: min 0
- paymentId: unique, required when completed

**State Transitions**:
- `pending` → `completed` (payment webhook success)
- `pending` → `failed` (payment webhook failure / timeout)
- `completed` → `refunded` (admin action, if implemented)

---

### Download

```typescript
interface Download {
  _id: ObjectId;
  purchaseId: ObjectId;       // ref: Purchase
  token: string;              // unique, secure random
  status: 'active' | 'used' | 'expired';
  expiresAt: Date;            // 24 hours from creation
  usedAt?: Date;              // when downloaded
  createdAt: Date;
}

// Indexes
- token: unique (for lookup)
- purchaseId: 1 (for finding download by purchase)
- status: 1, expiresAt: 1 (for cleanup job)
```

**Validation Rules**:
- token: required, unique, 64 chars hex
- expiresAt: required, must be future date on creation

**State Transitions**:
- `active` → `used` (successful download)
- `active` → `expired` (background job when expiresAt passed)

---

### MonthlyQuota

```typescript
interface MonthlyQuota {
  _id: ObjectId;
  userId: ObjectId;           // ref: User
  month: string;              // YYYY-MM format
  ebookCount: number;         // default: 0, max: 2
  audiobookCount: number;     // default: 0, max: 2
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
- userId: 1, month: 1 (compound unique)
```

**Validation Rules**:
- month: required, format YYYY-MM
- ebookCount: 0-2
- audiobookCount: 0-2

**Business Logic**:
- Created on first purchase of the month
- Incremented atomically on successful payment
- No reset needed (new month = new document)

---

## Relationships

```
User (1) ──────< Purchase (N)
                    │
Book (1) ──────────<┘
                    │
                    └──────> Download (1)

User (1) ──────< MonthlyQuota (N, one per month)
```

## Quota Check Query

```javascript
// Check if user can purchase book type
const quota = await MonthlyQuota.findOne({
  userId: userId,
  month: getCurrentMonth() // "2025-12"
});

const canPurchase = (bookType) => {
  if (!quota) return true; // No quota = first purchase this month
  if (bookType === 'ebook') return quota.ebookCount < 2;
  if (bookType === 'audiobook') return quota.audiobookCount < 2;
};

// Atomic increment on purchase
await MonthlyQuota.findOneAndUpdate(
  { userId, month: getCurrentMonth() },
  { 
    $inc: { [bookType + 'Count']: 1 },
    $setOnInsert: { createdAt: new Date() }
  },
  { upsert: true, new: true }
);
```

## Download Flow Query

```javascript
// Generate download link
const download = await Download.findOne({
  token: token,
  status: 'active',
  expiresAt: { $gt: new Date() }
}).populate('purchaseId');

if (!download) throw new Error('Invalid or expired download link');

// After successful download response
await Download.updateOne(
  { _id: download._id },
  { status: 'used', usedAt: new Date() }
);
```
