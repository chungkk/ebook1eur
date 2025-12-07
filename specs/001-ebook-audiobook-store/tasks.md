# Tasks: Ebook1eur - Ebook & Audiobook Store

**Input**: Design documents from `/specs/001-ebook-audiobook-store/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US6)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md: Single Next.js application with App Router

```
src/
├── app/           # Pages and API routes
├── components/    # React components
├── lib/           # Utilities
├── models/        # Mongoose models
└── types/         # TypeScript types
```

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create Next.js 15 project with TypeScript, Tailwind, App Router in project root
- [x] T002 Install core dependencies: mongoose, next-auth@beta, bcryptjs, zod in package.json
- [x] T003 [P] Install payment dependencies: stripe, @stripe/stripe-js, @paypal/react-paypal-js in package.json
- [x] T004 [P] Install UI dependencies: shadcn/ui components (button, card, input, form, dialog, table)
- [x] T005 [P] Install storage dependency: @google-cloud/storage in package.json
- [x] T006 [P] Create environment variables template in .env.example
- [x] T007 Configure Tailwind with bookworm theme colors in tailwind.config.ts
- [x] T008 [P] Create TypeScript types in src/types/index.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T009 Setup MongoDB connection utility in src/lib/db.ts
- [x] T010 [P] Create User model with Mongoose schema in src/models/User.ts
- [x] T011 [P] Create Book model with Mongoose schema in src/models/Book.ts
- [x] T012 [P] Create Purchase model with Mongoose schema in src/models/Purchase.ts
- [x] T013 [P] Create Download model with Mongoose schema in src/models/Download.ts
- [x] T014 [P] Create MonthlyQuota model with Mongoose schema in src/models/MonthlyQuota.ts
- [x] T015 Configure NextAuth.js v5 with Credentials provider in src/lib/auth.ts
- [x] T016 Create auth API route handler in src/app/api/auth/[...nextauth]/route.ts
- [x] T017 [P] Create Google Cloud Storage utility in src/lib/storage.ts
- [x] T018 [P] Create Stripe utility in src/lib/stripe.ts
- [x] T019 [P] Create PayPal utility in src/lib/paypal.ts
- [x] T020 [P] Create quota check utility in src/lib/quota.ts
- [x] T021 Create authentication middleware in src/middleware.ts
- [x] T022 [P] Create base layout with Navbar in src/app/layout.tsx
- [x] T023 [P] Create Navbar component in src/components/Navbar.tsx
- [x] T024 Create admin middleware/guard for protected routes in src/lib/admin-guard.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Browse and Purchase Books (Priority: P1) 🎯 MVP

**Goal**: User có thể duyệt sách (ebook/audiobook), thanh toán qua Stripe/PayPal, và tải về

**Independent Test**: Guest duyệt sách → User đăng nhập → Chọn sách → Thanh toán → Tải về thành công

### Implementation for User Story 1

**Book Listing (Public)**:
- [x] T025 [P] [US1] Create BookCard component in src/components/BookCard.tsx
- [x] T026 [P] [US1] Create BookList component with filtering in src/components/BookList.tsx
- [x] T027 [US1] Create books listing API route GET in src/app/api/books/route.ts
- [x] T028 [US1] Create book detail API route GET in src/app/api/books/[id]/route.ts
- [x] T029 [US1] Create home page with book categories in src/app/(main)/page.tsx
- [x] T030 [US1] Create books listing page with type filter in src/app/(main)/books/page.tsx
- [x] T031 [US1] Create book detail page in src/app/(main)/books/[id]/page.tsx

**Checkout Flow**:
- [x] T032 [P] [US1] Create CheckoutButton component in src/components/CheckoutButton.tsx
- [x] T033 [US1] Create Stripe checkout API route POST in src/app/api/checkout/stripe/route.ts
- [x] T034 [US1] Create PayPal order API route POST in src/app/api/checkout/paypal/route.ts
- [x] T035 [US1] Create PayPal capture API route POST in src/app/api/checkout/paypal/capture/route.ts
- [x] T036 [US1] Create Stripe webhook handler in src/app/api/webhooks/stripe/route.ts
- [x] T037 [US1] Create PayPal webhook handler in src/app/api/webhooks/paypal/route.ts

**Download Flow**:
- [x] T038 [US1] Create download API route with signed URL in src/app/api/download/[token]/route.ts
- [x] T039 [US1] Create download complete API route in src/app/api/download/[token]/complete/route.ts
- [x] T040 [US1] Create checkout success page with download link in src/app/(main)/checkout/success/page.tsx

**Checkpoint**: User Story 1 complete - Core purchase flow working

---

## Phase 4: User Story 2 - Monthly Purchase Limit (Priority: P1)

**Goal**: Giới hạn mỗi user tối đa 2 ebook + 2 audiobook/tháng

**Independent Test**: User mua 2 ebook → Cố mua ebook thứ 3 → Bị từ chối với thông báo

### Implementation for User Story 2

- [x] T041 [US2] Add quota check to Stripe checkout in src/app/api/checkout/stripe/route.ts
- [x] T042 [US2] Add quota check to PayPal checkout in src/app/api/checkout/paypal/route.ts
- [x] T043 [US2] Add quota increment to Stripe webhook in src/app/api/webhooks/stripe/route.ts
- [x] T044 [US2] Add quota increment to PayPal capture in src/app/api/checkout/paypal/capture/route.ts
- [x] T045 [P] [US2] Create QuotaDisplay component in src/components/QuotaDisplay.tsx
- [x] T046 [US2] Add quota display to book detail page in src/app/(main)/books/[id]/page.tsx
- [x] T047 [US2] Create quota API route GET in src/app/api/user/quota/route.ts

**Checkpoint**: User Story 2 complete - Quota enforcement working

---

## Phase 5: User Story 6 - Registration and Authentication (Priority: P2)

**Goal**: User đăng ký, đăng nhập, quên mật khẩu

**Independent Test**: Đăng ký tài khoản mới → Đăng nhập thành công

**Note**: Moved before US3-5 because auth is required for account management

### Implementation for User Story 6

- [x] T048 [P] [US6] Create register API route POST in src/app/api/auth/register/route.ts
- [x] T049 [P] [US6] Create forgot-password API route POST in src/app/api/auth/forgot-password/route.ts
- [x] T050 [P] [US6] Create reset-password API route POST in src/app/api/auth/reset-password/route.ts
- [x] T051 [P] [US6] Create LoginForm component in src/components/auth/LoginForm.tsx
- [x] T052 [P] [US6] Create RegisterForm component in src/components/auth/RegisterForm.tsx
- [x] T053 [P] [US6] Create ForgotPasswordForm component in src/components/auth/ForgotPasswordForm.tsx
- [x] T054 [US6] Create login page in src/app/(auth)/login/page.tsx
- [x] T055 [US6] Create register page in src/app/(auth)/register/page.tsx
- [x] T056 [US6] Create forgot-password page in src/app/(auth)/forgot-password/page.tsx
- [x] T057 [US6] Create reset-password page in src/app/(auth)/reset-password/page.tsx
- [x] T058 [P] [US6] Setup email service with Resend in src/lib/email.ts

**Checkpoint**: User Story 6 complete - Full auth flow working

---

## Phase 6: User Story 3 - Account Management (Priority: P2)

**Goal**: User xem lịch sử mua hàng, quota còn lại, thông tin tài khoản

**Independent Test**: User đăng nhập → Vào trang tài khoản → Xem lịch sử mua và quota

### Implementation for User Story 3

- [x] T059 [US3] Create purchases API route GET in src/app/api/user/purchases/route.ts
- [x] T060 [US3] Create profile API routes GET/PATCH in src/app/api/user/profile/route.ts
- [x] T061 [P] [US3] Create PurchaseHistory component in src/components/account/PurchaseHistory.tsx
- [x] T062 [P] [US3] Create ProfileForm component in src/components/account/ProfileForm.tsx
- [x] T063 [US3] Create account dashboard page in src/app/(main)/account/page.tsx
- [x] T064 [US3] Create purchases history page in src/app/(main)/account/purchases/page.tsx

**Checkpoint**: User Story 3 complete - User account management working

---

## Phase 7: User Story 4 - Admin Book Management (Priority: P2)

**Goal**: Admin upload sách, chỉnh sửa, xóa (soft delete)

**Independent Test**: Admin đăng nhập → Upload sách mới → Sách xuất hiện trên trang

### Implementation for User Story 4

- [x] T065 [US4] Create admin books API routes GET/POST in src/app/api/admin/books/route.ts
- [x] T066 [US4] Create admin book detail API routes PATCH/DELETE in src/app/api/admin/books/[id]/route.ts
- [x] T067 [P] [US4] Create BookForm component with file upload in src/components/admin/BookForm.tsx
- [x] T068 [P] [US4] Create AdminBookList component in src/components/admin/AdminBookList.tsx
- [x] T069 [US4] Create admin layout in src/app/admin/layout.tsx
- [x] T070 [US4] Create admin dashboard page in src/app/admin/page.tsx
- [x] T071 [US4] Create admin books listing page in src/app/admin/books/page.tsx
- [x] T072 [US4] Create admin book create page in src/app/admin/books/new/page.tsx
- [x] T073 [US4] Create admin book edit page in src/app/admin/books/[id]/edit/page.tsx

**Checkpoint**: User Story 4 complete - Admin book management working

---

## Phase 8: User Story 5 - Admin User Management (Priority: P3)

**Goal**: Admin xem danh sách user, lịch sử mua, khóa tài khoản

**Independent Test**: Admin đăng nhập → Xem danh sách user → Click user → Xem chi tiết

### Implementation for User Story 5

- [x] T074 [US5] Create admin users API route GET in src/app/api/admin/users/route.ts
- [x] T075 [US5] Create admin user detail API route GET in src/app/api/admin/users/[id]/route.ts
- [x] T076 [US5] Create admin user status API route PATCH in src/app/api/admin/users/[id]/status/route.ts
- [x] T077 [P] [US5] Create AdminUserList component in src/components/admin/AdminUserList.tsx
- [x] T078 [P] [US5] Create AdminUserDetail component in src/components/admin/AdminUserDetail.tsx
- [x] T079 [US5] Create admin users listing page in src/app/admin/users/page.tsx
- [x] T080 [US5] Create admin user detail page in src/app/admin/users/[id]/page.tsx

**Checkpoint**: User Story 5 complete - Admin user management working

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T081 [P] Add loading states to all pages with Suspense in src/app/
- [x] T082 [P] Add error boundaries to all pages in src/app/
- [x] T083 [P] Implement responsive design for mobile in all components
- [x] T084 Add SEO metadata to all public pages in src/app/(main)/
- [x] T085 [P] Create seed script for initial admin user in scripts/create-admin.ts
- [x] T086 [P] Create seed script for sample books in scripts/seed-books.ts
- [x] T087 Run full application test per quickstart.md scenarios
- [x] T088 Security review: validate all inputs, check auth on protected routes
- [x] T089 Performance review: optimize images, lazy loading, caching

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) ─────────────────────────────────────────────┐
                                                              │
Phase 2 (Foundational) ←──────────────────────────────────────┘
    │
    ├── Models (T010-T014) - parallel
    ├── Auth (T015-T016, T021)
    ├── Utilities (T017-T020) - parallel
    └── Layout (T022-T024) - parallel
    │
    ▼ [BLOCKS ALL USER STORIES]
    │
    ├── Phase 3 (US1: Browse/Purchase) ←──────────────────┐
    │       └── Checkout flows need auth + models         │
    │                                                      │
    ├── Phase 4 (US2: Quota) ←─────────────────────────────┤ Can run in
    │       └── Integrates with US1 checkout               │ parallel after
    │                                                      │ Phase 2
    ├── Phase 5 (US6: Auth UI) ←───────────────────────────┤
    │       └── Uses auth from Phase 2                     │
    │                                                      │
    ├── Phase 6 (US3: Account) ←───────────────────────────┤
    │       └── Requires auth UI (US6)                     │
    │                                                      │
    ├── Phase 7 (US4: Admin Books) ←───────────────────────┤
    │       └── Uses Book model + storage                  │
    │                                                      │
    └── Phase 8 (US5: Admin Users) ←───────────────────────┘
            └── Uses User model
    │
    ▼
Phase 9 (Polish) - After desired user stories complete
```

### User Story Dependencies

| Story | Depends On | Can Start After |
|-------|------------|-----------------|
| US1 (Browse/Purchase) | Phase 2 | Phase 2 complete |
| US2 (Quota) | US1 (modifies checkout) | Phase 2 complete, integrate with US1 |
| US6 (Auth UI) | Phase 2 | Phase 2 complete |
| US3 (Account) | US6 (auth UI) | Phase 2 complete |
| US4 (Admin Books) | Phase 2 | Phase 2 complete |
| US5 (Admin Users) | Phase 2 | Phase 2 complete |

### Parallel Opportunities per Phase

**Phase 1 (Setup)**: T003, T004, T005, T006, T008 can run in parallel

**Phase 2 (Foundational)**: 
- Models T010-T014 can run in parallel
- Utilities T017-T020 can run in parallel
- Layout T022-T024 can run in parallel

**Phase 3 (US1)**:
- T025, T026, T032 (components) can run in parallel
- API routes should be sequential for integration

**Phase 5 (US6)**:
- T048-T053 (API + form components) can run in parallel
- Pages should follow forms

**Phase 7 (US4)**:
- T067, T068 (components) can run in parallel

**Phase 8 (US5)**:
- T077, T078 (components) can run in parallel

---

## Implementation Strategy

### MVP First (User Story 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Browse/Purchase)
4. Complete Phase 4: User Story 2 (Quota)
5. **STOP and VALIDATE**: Test full purchase flow with quota
6. Deploy/demo if ready - this is a functional MVP!

### Recommended Order for Solo Developer

1. **Phase 1** → **Phase 2** → **Phase 3** → **Phase 4** (MVP complete)
2. **Phase 5** (Auth UI) → **Phase 6** (Account)
3. **Phase 7** (Admin Books) → **Phase 8** (Admin Users)
4. **Phase 9** (Polish)

### Parallel Team Strategy (3 developers)

After Phase 2 complete:
- Developer A: US1 + US2 (core purchase flow)
- Developer B: US6 + US3 (auth + account)
- Developer C: US4 + US5 (admin features)

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story
- Each user story can be tested independently after completion
- Commit after each task or logical group
- Stop at any checkpoint to validate
- US2 (Quota) modifies US1 checkout - plan integration carefully
