# Quickstart: Ebook1eur

## Prerequisites

- Node.js 20+ (LTS)
- MongoDB (local or Atlas)
- Google Cloud account với Storage bucket
- Stripe account (test mode)
- PayPal Developer account (sandbox)

## 1. Project Setup

```bash
# Create Next.js project
npx create-next-app@latest ebook1eur --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

cd ebook1eur

# Install dependencies
npm install mongoose @auth/mongodb-adapter next-auth@beta bcryptjs
npm install @stripe/stripe-js stripe @paypal/react-paypal-js
npm install @google-cloud/storage
npm install resend
npm install zod

# Dev dependencies
npm install -D @types/bcryptjs vitest @vitejs/plugin-react playwright
```

## 2. Environment Variables

Create `.env.local`:

```env
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ebook1eur

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Google Cloud Storage
GCS_PROJECT_ID=your-project-id
GCS_BUCKET_NAME=ebook1eur-files
GCS_KEY_FILE=./gcs-service-account.json

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_MODE=sandbox

# Email
RESEND_API_KEY=re_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 3. Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── (main)/
│   │   ├── page.tsx                 # Home - book listing
│   │   ├── books/
│   │   │   ├── page.tsx             # All books
│   │   │   └── [id]/page.tsx        # Book detail
│   │   └── account/
│   │       ├── page.tsx             # User dashboard
│   │       └── purchases/page.tsx   # Purchase history
│   ├── admin/
│   │   ├── layout.tsx               # Admin layout
│   │   ├── page.tsx                 # Admin dashboard
│   │   ├── books/
│   │   │   ├── page.tsx             # Book management
│   │   │   └── [id]/edit/page.tsx   # Edit book
│   │   └── users/
│   │       └── page.tsx             # User management
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── books/route.ts
│   │   ├── books/[id]/route.ts
│   │   ├── user/
│   │   │   ├── quota/route.ts
│   │   │   ├── purchases/route.ts
│   │   │   └── profile/route.ts
│   │   ├── checkout/
│   │   │   ├── stripe/route.ts
│   │   │   └── paypal/route.ts
│   │   ├── webhooks/
│   │   │   ├── stripe/route.ts
│   │   │   └── paypal/route.ts
│   │   ├── download/[token]/route.ts
│   │   └── admin/
│   │       ├── books/route.ts
│   │       └── users/route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                          # shadcn/ui components
│   ├── BookCard.tsx
│   ├── BookList.tsx
│   ├── CheckoutButton.tsx
│   ├── QuotaDisplay.tsx
│   └── Navbar.tsx
├── lib/
│   ├── db.ts                        # MongoDB connection
│   ├── auth.ts                      # NextAuth config
│   ├── storage.ts                   # GCS utilities
│   ├── stripe.ts                    # Stripe utilities
│   ├── paypal.ts                    # PayPal utilities
│   └── utils.ts                     # General utilities
├── models/
│   ├── User.ts
│   ├── Book.ts
│   ├── Purchase.ts
│   ├── Download.ts
│   └── MonthlyQuota.ts
└── types/
    └── index.ts
```

## 4. Key Implementation Files

### MongoDB Connection (`src/lib/db.ts`)

```typescript
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
```

### NextAuth Config (`src/lib/auth.ts`)

```typescript
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { connectDB } from './db';
import User from '@/models/User';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        await connectDB();
        const user = await User.findOne({ email: credentials.email });
        if (!user || user.status === 'blocked') return null;
        
        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!isValid) return null;
        
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub!;
      session.user.role = token.role as string;
      return session;
    },
  },
});
```

### Quota Check Utility (`src/lib/quota.ts`)

```typescript
import { connectDB } from './db';
import MonthlyQuota from '@/models/MonthlyQuota';

export function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

export async function checkQuota(userId: string, bookType: 'ebook' | 'audiobook') {
  await connectDB();
  const quota = await MonthlyQuota.findOne({
    userId,
    month: getCurrentMonth(),
  });

  if (!quota) return { canPurchase: true, used: 0, remaining: 2 };

  const count = bookType === 'ebook' ? quota.ebookCount : quota.audiobookCount;
  return {
    canPurchase: count < 2,
    used: count,
    remaining: 2 - count,
  };
}

export async function incrementQuota(userId: string, bookType: 'ebook' | 'audiobook') {
  await connectDB();
  const field = bookType === 'ebook' ? 'ebookCount' : 'audiobookCount';
  
  await MonthlyQuota.findOneAndUpdate(
    { userId, month: getCurrentMonth() },
    { $inc: { [field]: 1 } },
    { upsert: true }
  );
}
```

## 5. Running the Project

```bash
# Development
npm run dev

# Run tests
npm run test

# Build for production
npm run build
npm start
```

## 6. External Service Setup

### Google Cloud Storage

1. Create bucket `ebook1eur-files`
2. Create service account with Storage Admin role
3. Download JSON key file
4. Set CORS policy for download redirects

### Stripe

1. Get API keys from Dashboard
2. Set up webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Subscribe to `checkout.session.completed` event

### PayPal

1. Create app in Developer Dashboard
2. Get Client ID and Secret
3. Set up webhook for `CHECKOUT.ORDER.APPROVED`

## 7. First Admin User

Create admin via script or MongoDB shell:

```javascript
// scripts/create-admin.ts
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

async function createAdmin() {
  await connectDB();
  
  const passwordHash = await bcrypt.hash('admin123', 10);
  
  await User.create({
    email: 'admin@ebook1eur.com',
    passwordHash,
    name: 'Admin',
    role: 'admin',
    status: 'active',
    emailVerified: true,
  });
  
  console.log('Admin created');
}

createAdmin();
```
