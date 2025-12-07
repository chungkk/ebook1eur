# Implementation Plan: Ebook1eur - Ebook & Audiobook Store

**Branch**: `001-ebook-audiobook-store` | **Date**: 2025-12-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-ebook-audiobook-store/spec.md`

## Summary

Xây dựng trang bán sách ebook1eur.com với ebook và audiobook, giới hạn 2+2 sách/tháng/user, tích hợp Stripe/PayPal, download một lần. Sử dụng Next.js 15 App Router, MongoDB, Google Cloud Storage.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+  
**Framework**: Next.js 15 (App Router)  
**Primary Dependencies**: NextAuth.js v5, Mongoose, Stripe, PayPal SDK, shadcn/ui  
**Storage**: MongoDB (data), Google Cloud Storage (files up to 2GB)  
**Testing**: Vitest (unit), Playwright (E2E)  
**Target Platform**: Web (Desktop + Mobile responsive)  
**Project Type**: Full-stack web application  
**Performance Goals**: Page load <3s on 3G, checkout <30s  
**Constraints**: Max 2GB file upload, monthly quota enforcement  
**Scale/Scope**: MVP for single admin, unlimited users, ~1000 books

## Constitution Check

*GATE: Constitution template not customized - using default best practices.*

- [x] Simple architecture (single Next.js app)
- [x] Standard patterns (App Router, API Routes)
- [x] No unnecessary abstractions
- [x] Clear separation: pages, components, lib, models

## Project Structure

### Documentation (this feature)

```text
specs/001-ebook-audiobook-store/
├── plan.md              # This file
├── research.md          # Technology decisions
├── data-model.md        # MongoDB schemas
├── quickstart.md        # Setup guide
├── contracts/           # API specifications
│   └── api.md
└── tasks.md             # Implementation tasks (next phase)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (auth)/              # Auth pages (login, register, forgot-password)
│   ├── (main)/              # Public pages (home, books, account)
│   ├── admin/               # Admin dashboard
│   └── api/                 # API routes
├── components/
│   ├── ui/                  # shadcn/ui components
│   └── ...                  # Feature components
├── lib/                     # Utilities (db, auth, storage, payments)
├── models/                  # Mongoose models
└── types/                   # TypeScript types

tests/
├── unit/                    # Vitest unit tests
└── e2e/                     # Playwright E2E tests
```

**Structure Decision**: Single Next.js application với App Router. Frontend và backend trong cùng project, sử dụng API Routes cho backend logic. Phù hợp cho MVP và dễ deploy lên Vercel.

## Complexity Tracking

> No violations - simple architecture selected.
