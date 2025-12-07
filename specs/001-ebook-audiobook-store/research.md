# Research: Ebook1eur - Ebook & Audiobook Store

**Feature**: 001-ebook-audiobook-store  
**Date**: 2025-12-07

## Technology Stack Decisions

### 1. Framework: Next.js 15 (App Router)

**Decision**: Next.js 15 với App Router

**Rationale**:
- User yêu cầu "bản mới nhất" của Next.js
- App Router là kiến trúc mặc định và được khuyến nghị
- Server Components giúp tối ưu performance cho trang browse sách
- Server Actions phù hợp cho form submissions (checkout, auth)
- Built-in API routes cho backend logic
- Excellent SEO với SSR/SSG cho trang public

**Alternatives Considered**:
- Next.js Pages Router: Legacy, không được khuyến nghị cho dự án mới
- Remix: Tốt nhưng không phải yêu cầu của user
- Nuxt.js: Vue-based, không phải yêu cầu

### 2. Database: MongoDB

**Decision**: MongoDB với Mongoose ODM

**Rationale**:
- User yêu cầu MongoDB
- Flexible schema phù hợp cho metadata sách (có thể mở rộng)
- Mongoose cung cấp schema validation, middleware, và type safety
- MongoDB Atlas cho managed hosting với backup tự động

**Alternatives Considered**:
- PostgreSQL: Relational, user không yêu cầu
- MySQL: User không yêu cầu

### 3. File Storage: Google Cloud Storage

**Decision**: Google Cloud Storage với Signed URLs

**Rationale**:
- User yêu cầu Google Cloud
- Signed URLs cho secure, time-limited downloads
- Tích hợp tốt với Next.js API routes
- CDN integration cho fast delivery
- Resumable uploads cho file lớn (2GB max)

**Implementation Pattern**:
- Upload: Admin → Next.js API → GCS (resumable upload)
- Download: User → Next.js API (verify purchase) → Generate Signed URL → GCS

### 4. Payment: Stripe + PayPal

**Decision**: Stripe Checkout + PayPal SDK

**Rationale**:
- User yêu cầu cả 2 payment gateway
- Stripe Checkout: Hosted checkout page, PCI compliant
- PayPal SDK: PayPal buttons integration
- Webhook handlers cho payment confirmation

**Implementation Pattern**:
- Stripe: `@stripe/stripe-js` + Stripe Checkout Sessions
- PayPal: `@paypal/react-paypal-js` + PayPal Orders API
- Webhooks: Verify payment → Create download link → Update quota

### 5. Authentication: NextAuth.js v5

**Decision**: NextAuth.js v5 (Auth.js) với Credentials Provider

**Rationale**:
- Native integration với Next.js App Router
- Session management built-in
- Email/Password với Credentials Provider
- Easy to add social login later if needed

**Implementation Pattern**:
- Credentials Provider với bcrypt password hashing
- MongoDB adapter cho session storage
- JWT strategy cho stateless auth
- Protected routes via middleware

### 6. UI Framework: Tailwind CSS + shadcn/ui

**Decision**: Tailwind CSS với shadcn/ui components

**Rationale**:
- Tailwind cho custom "bookworm style" theming
- shadcn/ui cung cấp accessible, customizable components
- Responsive design built-in
- Dark/light theme support (spec yêu cầu "sáng")

**Bookworm Style Implementation**:
- Warm color palette: cream backgrounds, brown/amber accents
- Book-themed icons và illustrations
- Readable typography (serif for content, sans-serif for UI)
- Paper texture effects

### 7. Email Service: Resend

**Decision**: Resend cho transactional emails

**Rationale**:
- Modern API, easy integration với Next.js
- React Email cho email templates
- Reliable delivery cho password reset, purchase confirmation

### 8. Testing: Vitest + Playwright

**Decision**: Vitest cho unit tests, Playwright cho E2E

**Rationale**:
- Vitest native ESM support, fast execution
- Playwright cross-browser testing
- Good Next.js integration

## Architecture Decisions

### Quota System Design

**Approach**: Aggregation-based counting

```
MonthlyQuota Collection:
- userId + month (YYYY-MM) as compound index
- ebookCount, audiobookCount fields
- Increment on successful payment webhook
- Reset: No action needed (new month = new document)
```

**Why not per-purchase counting?**
- Aggregation on Purchase collection would be slower
- Dedicated quota document allows atomic updates
- Clear separation of concerns

### Download Link System

**Approach**: Token-based one-time links

```
Download Collection:
- purchaseId (reference)
- token (unique, cryptographically secure)
- status: 'active' | 'used' | 'expired'
- expiresAt: Date (24 hours from creation)
- usedAt: Date (null until downloaded)
```

**Download Flow**:
1. Payment webhook → Create Download record with unique token
2. User clicks download → Verify token status
3. If valid → Generate GCS Signed URL (5 min expiry) → Redirect
4. On successful response → Mark token as 'used'
5. Background job: Mark expired tokens

### Admin Role Management

**Approach**: Role field in User document

```
User.role: 'user' | 'admin'
```

- Simple, sufficient for 2 roles
- Middleware checks role for admin routes
- First admin created via seed script or environment variable

## Security Considerations

1. **File Access**: GCS Signed URLs prevent direct file access
2. **Payment**: Stripe/PayPal handle PCI compliance
3. **Auth**: bcrypt hashing, JWT with secure secret
4. **CSRF**: Next.js Server Actions have built-in protection
5. **Rate Limiting**: Implement on payment endpoints

## Performance Considerations

1. **SSR/SSG**: Static generation for book catalog pages
2. **Image Optimization**: Next.js Image component for covers
3. **Lazy Loading**: Infinite scroll for book lists
4. **Caching**: MongoDB indexes, GCS CDN
5. **Bundle Size**: Dynamic imports for payment SDKs
