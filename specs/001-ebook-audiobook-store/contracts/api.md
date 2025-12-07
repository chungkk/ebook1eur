# API Contracts: Ebook1eur

**Base URL**: `/api`  
**Format**: JSON  
**Authentication**: JWT via NextAuth.js (Cookie-based sessions)

## Authentication APIs

### POST /api/auth/register

Register a new user account.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "Nguyen Van A"
}
```

**Response 201**:
```json
{
  "success": true,
  "message": "Đăng ký thành công. Vui lòng kiểm tra email để xác thực."
}
```

**Response 400**:
```json
{
  "success": false,
  "error": "Email đã được sử dụng"
}
```

---

### POST /api/auth/[...nextauth]

NextAuth.js handles: signIn, signOut, session, csrf

---

### POST /api/auth/forgot-password

Request password reset email.

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response 200**:
```json
{
  "success": true,
  "message": "Email đặt lại mật khẩu đã được gửi"
}
```

---

### POST /api/auth/reset-password

Reset password with token.

**Request Body**:
```json
{
  "token": "reset-token-from-email",
  "password": "newSecurePassword123"
}
```

**Response 200**:
```json
{
  "success": true,
  "message": "Mật khẩu đã được đặt lại"
}
```

---

## Book APIs (Public)

### GET /api/books

List books with pagination and filtering.

**Query Parameters**:
- `type`: `ebook` | `audiobook` (optional)
- `page`: number (default: 1)
- `limit`: number (default: 20, max: 100)
- `search`: string (optional, searches title & author)

**Response 200**:
```json
{
  "success": true,
  "data": {
    "books": [
      {
        "id": "64a1b2c3d4e5f6g7h8i9j0k1",
        "title": "Đắc Nhân Tâm",
        "description": "Cuốn sách kinh điển về nghệ thuật giao tiếp...",
        "author": "Dale Carnegie",
        "type": "ebook",
        "price": 1.00,
        "coverImage": "https://storage.googleapis.com/ebook1eur/covers/abc123.jpg"
      },
      {
        "id": "64a1b2c3d4e5f6g7h8i9j0k2",
        "title": "Nhà Giả Kim",
        "description": "Câu chuyện về chàng chăn cừu Santiago...",
        "author": "Paulo Coelho",
        "type": "audiobook",
        "duration": 14400,
        "price": 1.00,
        "coverImage": "https://storage.googleapis.com/ebook1eur/covers/def456.jpg"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

---

### GET /api/books/[id]

Get book details.

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "64a1b2c3d4e5f6g7h8i9j0k1",
    "title": "Đắc Nhân Tâm",
    "description": "Cuốn sách kinh điển về nghệ thuật giao tiếp...",
    "author": "Dale Carnegie",
    "type": "ebook",
    "price": 1.00,
    "coverImage": "https://storage.googleapis.com/ebook1eur/covers/abc123.jpg",
    "fileSize": 5242880,
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

**Response 404**:
```json
{
  "success": false,
  "error": "Không tìm thấy sách"
}
```

---

## User APIs (Authenticated)

### GET /api/user/quota

Get current month's remaining quota.

**Response 200**:
```json
{
  "success": true,
  "data": {
    "month": "2025-12",
    "ebook": {
      "used": 1,
      "remaining": 1,
      "limit": 2
    },
    "audiobook": {
      "used": 0,
      "remaining": 2,
      "limit": 2
    }
  }
}
```

---

### GET /api/user/purchases

Get user's purchase history.

**Query Parameters**:
- `page`: number (default: 1)
- `limit`: number (default: 20)

**Response 200**:
```json
{
  "success": true,
  "data": {
    "purchases": [
      {
        "id": "64a1b2c3d4e5f6g7h8i9j0k1",
        "book": {
          "id": "...",
          "title": "Đắc Nhân Tâm",
          "type": "ebook",
          "coverImage": "..."
        },
        "amount": 1.00,
        "paymentMethod": "stripe",
        "status": "completed",
        "downloadStatus": "active",
        "createdAt": "2025-12-01T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

---

### GET /api/user/profile

Get current user profile.

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "64a1b2c3d4e5f6g7h8i9j0k1",
    "email": "user@example.com",
    "name": "Nguyen Van A",
    "emailVerified": true,
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

---

### PATCH /api/user/profile

Update user profile.

**Request Body**:
```json
{
  "name": "Nguyen Van B"
}
```

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "Nguyen Van B"
  }
}
```

---

## Payment APIs (Authenticated)

### POST /api/checkout/stripe

Create Stripe checkout session.

**Request Body**:
```json
{
  "bookId": "64a1b2c3d4e5f6g7h8i9j0k1"
}
```

**Response 200**:
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_...",
    "url": "https://checkout.stripe.com/..."
  }
}
```

**Response 400** (Quota exceeded):
```json
{
  "success": false,
  "error": "Bạn đã đạt giới hạn 2 ebook/tháng. Vui lòng quay lại vào tháng sau."
}
```

---

### POST /api/checkout/paypal

Create PayPal order.

**Request Body**:
```json
{
  "bookId": "64a1b2c3d4e5f6g7h8i9j0k1"
}
```

**Response 200**:
```json
{
  "success": true,
  "data": {
    "orderId": "5O190127TN364715T"
  }
}
```

---

### POST /api/checkout/paypal/capture

Capture PayPal payment after approval.

**Request Body**:
```json
{
  "orderId": "5O190127TN364715T"
}
```

**Response 200**:
```json
{
  "success": true,
  "data": {
    "purchaseId": "64a1b2c3d4e5f6g7h8i9j0k1",
    "downloadToken": "abc123..."
  }
}
```

---

### POST /api/webhooks/stripe

Stripe webhook handler (internal).

**Headers**:
- `stripe-signature`: Webhook signature

**Events Handled**:
- `checkout.session.completed`: Create purchase & download link, update quota

---

### POST /api/webhooks/paypal

PayPal webhook handler (internal).

**Events Handled**:
- `CHECKOUT.ORDER.APPROVED`: Verify and process payment

---

## Download API (Authenticated)

### GET /api/download/[token]

Download purchased book.

**Response 302**: Redirect to GCS Signed URL

**Response 400**:
```json
{
  "success": false,
  "error": "Link tải đã hết hạn hoặc đã được sử dụng"
}
```

**Response 404**:
```json
{
  "success": false,
  "error": "Link tải không hợp lệ"
}
```

---

### POST /api/download/[token]/complete

Mark download as completed (called after successful download).

**Response 200**:
```json
{
  "success": true,
  "message": "Download completed"
}
```

---

## Admin APIs (Admin Role Required)

### GET /api/admin/books

List all books (including deleted).

**Query Parameters**:
- `status`: `active` | `deleted` | `all` (default: `all`)
- `page`, `limit`, `search`

---

### POST /api/admin/books

Create new book.

**Request Body** (multipart/form-data):
```
title: "Tên sách"
description: "Mô tả sách"
author: "Tên tác giả"
type: "ebook" | "audiobook"
duration: 14400 (required if audiobook)
price: 1.00
coverImage: File
bookFile: File (max 2GB)
```

**Response 201**:
```json
{
  "success": true,
  "data": {
    "id": "64a1b2c3d4e5f6g7h8i9j0k1",
    "title": "Tên sách",
    ...
  }
}
```

---

### PATCH /api/admin/books/[id]

Update book details.

**Request Body** (multipart/form-data):
```
title: "Tên sách mới"
description: "Mô tả mới"
...
coverImage: File (optional)
bookFile: File (optional, max 2GB)
```

---

### DELETE /api/admin/books/[id]

Soft delete book.

**Response 200**:
```json
{
  "success": true,
  "message": "Sách đã được xóa"
}
```

---

### GET /api/admin/users

List all users.

**Query Parameters**:
- `status`: `active` | `blocked` | `all`
- `page`, `limit`, `search`

**Response 200**:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "...",
        "email": "user@example.com",
        "name": "Nguyen Van A",
        "status": "active",
        "role": "user",
        "monthlyPurchases": {
          "ebook": 1,
          "audiobook": 2
        },
        "createdAt": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

---

### GET /api/admin/users/[id]

Get user details with purchase history.

---

### PATCH /api/admin/users/[id]/status

Block/unblock user.

**Request Body**:
```json
{
  "status": "blocked" | "active"
}
```

**Response 200**:
```json
{
  "success": true,
  "message": "Tài khoản đã bị khóa"
}
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message in Vietnamese",
  "code": "ERROR_CODE" // optional, for programmatic handling
}
```

**Common Error Codes**:
- `UNAUTHORIZED`: Not logged in
- `FORBIDDEN`: Not authorized (wrong role)
- `NOT_FOUND`: Resource not found
- `QUOTA_EXCEEDED`: Monthly purchase limit reached
- `VALIDATION_ERROR`: Invalid input data
- `PAYMENT_FAILED`: Payment processing error
- `DOWNLOAD_EXPIRED`: Download link expired or used
