# Feature Specification: Ebook1eur - Ebook & Audiobook Store

**Feature Branch**: `001-ebook-audiobook-store`  
**Created**: 2025-12-07  
**Status**: Draft  
**Input**: User description: "Trang bán sách ebook1eur.com với ebook và sách nói, giới hạn 2 ebook + 2 audiobook/tháng/user, tích hợp PayPal/Stripe, giao diện bookworm style"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - User Browses and Purchases Books (Priority: P1)

Người dùng truy cập trang ebook1eur.com để duyệt và mua sách. Họ có thể xem danh mục sách theo 2 loại: ebook và sách nói. Sau khi chọn sách, họ thanh toán qua PayPal hoặc Stripe và nhận link tải về.

**Why this priority**: Đây là chức năng cốt lõi của nền tảng - cho phép user mua và tải sách. Không có chức năng này, trang không có giá trị.

**Independent Test**: Có thể test bằng cách tạo một user, duyệt sách, thanh toán và tải về thành công.

**Acceptance Scenarios**:

1. **Given** visitor (guest hoặc user đã đăng nhập) đang ở trang chủ, **When** click vào category "Ebook" hoặc "Sách nói", **Then** hiển thị danh sách sách tương ứng với thông tin: tiêu đề, tác giả, mô tả, thời lượng (nếu là audiobook), giá.
2. **Given** user đã chọn sách và thêm vào giỏ hàng, **When** user tiến hành thanh toán, **Then** hệ thống hiển thị tùy chọn PayPal hoặc Stripe.
3. **Given** user thanh toán thành công, **When** giao dịch hoàn tất, **Then** hệ thống tạo link download có thời hạn và gửi cho user.
4. **Given** user đã tải sách về thành công, **When** user cố gắng tải lại, **Then** link bị vô hiệu hóa và hiển thị thông báo "Link đã hết hạn".

---

### User Story 2 - Monthly Purchase Limit Enforcement (Priority: P1)

Hệ thống giới hạn mỗi user chỉ được mua tối đa 2 ebook và 2 audiobook mỗi tháng. Đây là quy tắc kinh doanh quan trọng.

**Why this priority**: Đây là yêu cầu kinh doanh đặc biệt quan trọng được user nhấn mạnh nhiều lần.

**Independent Test**: Tạo user, mua 2 ebook, sau đó cố mua ebook thứ 3 - hệ thống phải từ chối.

**Acceptance Scenarios**:

1. **Given** user đã mua 2 ebook trong tháng này, **When** user cố mua ebook thứ 3, **Then** hệ thống từ chối và thông báo "Bạn đã đạt giới hạn 2 ebook/tháng. Vui lòng quay lại vào tháng sau."
2. **Given** user đã mua 2 audiobook trong tháng này, **When** user cố mua audiobook thứ 3, **Then** hệ thống từ chối và thông báo "Bạn đã đạt giới hạn 2 sách nói/tháng. Vui lòng quay lại vào tháng sau."
3. **Given** user đã mua 2 ebook và 2 audiobook, **When** tháng mới bắt đầu, **Then** quota reset về 0 và user có thể mua lại.
4. **Given** user chưa mua sách nào trong tháng, **When** user xem trang cá nhân, **Then** hiển thị "Còn lại: 2 ebook, 2 sách nói".

---

### User Story 3 - User Account Management (Priority: P2)

User có trang quản lý cá nhân để xem lịch sử mua hàng, quota còn lại, và quản lý thông tin tài khoản.

**Why this priority**: Quan trọng cho trải nghiệm user nhưng không phải chức năng cốt lõi.

**Independent Test**: User đăng nhập, vào trang cá nhân, xem được lịch sử mua và quota.

**Acceptance Scenarios**:

1. **Given** user đã đăng nhập, **When** user vào trang "Tài khoản của tôi", **Then** hiển thị: lịch sử mua hàng, quota còn lại (x ebook, y audiobook), thông tin cá nhân.
2. **Given** user có lịch sử mua hàng, **When** user xem chi tiết đơn hàng, **Then** hiển thị: ngày mua, tên sách, loại sách, giá, trạng thái download.

---

### User Story 4 - Admin Book Management (Priority: P2)

Admin có thể tải sách lên, chỉnh sửa thông tin sách (tiêu đề, mô tả, tác giả, thời lượng), và xóa sách.

**Why this priority**: Admin cần quản lý nội dung để trang có sách bán.

**Independent Test**: Admin đăng nhập, upload một cuốn sách với đầy đủ thông tin, sách xuất hiện trên trang.

**Acceptance Scenarios**:

1. **Given** admin đã đăng nhập vào trang quản trị, **When** admin upload sách mới, **Then** hệ thống yêu cầu nhập: tiêu đề, mô tả, tác giả, loại sách (ebook/audiobook), thời lượng (nếu audiobook), file sách (tối đa 2GB), ảnh bìa, giá.
2. **Given** admin đã upload sách, **When** admin chỉnh sửa thông tin, **Then** thông tin được cập nhật trên trang.
3. **Given** admin muốn xóa sách, **When** admin click xóa, **Then** sách bị ẩn khỏi danh sách (soft delete để giữ lịch sử mua).

---

### User Story 5 - Admin User Management (Priority: P3)

Admin có thể xem và quản lý danh sách user, xem lịch sử mua của user, và khóa tài khoản nếu cần.

**Why this priority**: Chức năng quản trị phụ trợ, không ảnh hưởng đến chức năng chính.

**Independent Test**: Admin đăng nhập, xem danh sách user, click vào user để xem chi tiết.

**Acceptance Scenarios**:

1. **Given** admin ở trang quản lý user, **When** admin xem danh sách, **Then** hiển thị: tên, email, ngày đăng ký, số sách đã mua tháng này.
2. **Given** admin click vào user, **When** trang chi tiết mở ra, **Then** hiển thị lịch sử mua hàng đầy đủ.
3. **Given** admin muốn khóa user, **When** admin click "Khóa tài khoản", **Then** user không thể đăng nhập và mua sách.

---

### User Story 6 - User Registration and Authentication (Priority: P2)

User đăng ký tài khoản và đăng nhập để mua sách.

**Why this priority**: Cần thiết để tracking quota và lịch sử mua hàng.

**Independent Test**: Đăng ký tài khoản mới, đăng nhập thành công.

**Acceptance Scenarios**:

1. **Given** visitor ở trang chủ, **When** click "Đăng ký", **Then** form đăng ký hiển thị yêu cầu: email, mật khẩu, xác nhận mật khẩu.
2. **Given** user đã đăng ký, **When** user đăng nhập với email/password đúng, **Then** chuyển hướng đến trang chủ với trạng thái đã đăng nhập.
3. **Given** user quên mật khẩu, **When** user click "Quên mật khẩu", **Then** hệ thống gửi email reset password.

---

### Edge Cases

- Điều gì xảy ra khi user mua sách nhưng thanh toán thất bại? -> Đơn hàng lưu trạng thái "pending", không tính vào quota, không tạo link download.
- Điều gì xảy ra khi user đang tải sách giữa chừng thì mất kết nối? -> Link vẫn còn hiệu lực cho đến khi download hoàn tất (xác nhận bằng response success từ server).
- Điều gì xảy ra khi admin xóa sách mà user đã mua? -> User vẫn giữ quyền download (nếu chưa tải), sách bị soft delete.
- Điều gì xảy ra vào thời điểm chuyển tháng khi user đang checkout? -> Quota tính theo thời điểm thanh toán thành công.
- Điều gì xảy ra khi user mua 2 sách cùng lúc và cả 2 vượt quota? -> Hệ thống kiểm tra quota trước khi cho phép checkout, từ chối nếu tổng vượt quota.

## Requirements *(mandatory)*

### Functional Requirements

**Quản lý Sách:**
- **FR-001**: Hệ thống PHẢI phân loại sách thành 2 loại: Ebook và Sách nói (Audiobook).
- **FR-002**: Mỗi sách PHẢI có: tiêu đề, mô tả, tác giả, loại sách, giá, ảnh bìa, file sách.
- **FR-003**: Sách nói PHẢI có thêm thông tin thời lượng (duration).
- **FR-004**: Admin PHẢI có khả năng tải sách lên, chỉnh sửa, và xóa (soft delete) sách.

**Quản lý User:**
- **FR-005**: User PHẢI đăng ký tài khoản bằng email/password để mua sách. Guest có thể duyệt xem sách mà không cần đăng nhập.
- **FR-006**: Hệ thống PHẢI hỗ trợ đăng nhập, đăng xuất, quên mật khẩu.
- **FR-007**: User PHẢI có trang cá nhân xem lịch sử mua hàng và quota còn lại.
- **FR-008**: Admin PHẢI có khả năng xem, tìm kiếm, và khóa tài khoản user.

**Giới hạn Mua hàng (QUAN TRỌNG):**
- **FR-009**: Mỗi user PHẢI bị giới hạn tối đa 2 ebook/tháng.
- **FR-010**: Mỗi user PHẢI bị giới hạn tối đa 2 audiobook/tháng.
- **FR-011**: Quota PHẢI reset vào ngày đầu tiên của mỗi tháng (00:00 UTC).
- **FR-012**: Hệ thống PHẢI kiểm tra quota trước khi cho phép checkout.
- **FR-013**: Hệ thống PHẢI hiển thị quota còn lại cho user.

**Thanh toán:**
- **FR-014**: Hệ thống PHẢI tích hợp cổng thanh toán PayPal.
- **FR-015**: Hệ thống PHẢI tích hợp cổng thanh toán Stripe.
- **FR-016**: User PHẢI được chọn phương thức thanh toán khi checkout.

**Download:**
- **FR-017**: Sau thanh toán thành công, hệ thống PHẢI tạo link download cho user.
- **FR-018**: Link download PHẢI bị vô hiệu hóa sau khi user tải thành công một lần.
- **FR-019**: Hệ thống PHẢI xác nhận download hoàn tất trước khi vô hiệu hóa link.

**Giao diện:**
- **FR-020**: Giao diện PHẢI responsive, hỗ trợ cả mobile và desktop.
- **FR-021**: Giao diện PHẢI có theme sáng, nhiều màu sắc, phong cách mọt sách (bookworm style).

**Admin:**
- **FR-022**: Admin PHẢI có trang quản trị riêng biệt.
- **FR-023**: Admin PHẢI có khả năng quản lý sách (CRUD).
- **FR-024**: Admin PHẢI có khả năng quản lý user (xem, khóa).

### Key Entities

- **User**: Người dùng với email, password hash, tên, ngày đăng ký, trạng thái (active/blocked), role (user/admin).
- **Book**: Sách với tiêu đề, mô tả, tác giả, loại (ebook/audiobook), thời lượng (nullable), giá, file path (Google Cloud Storage URL), cover image, trạng thái (active/deleted), ngày tạo.
- **Purchase**: Giao dịch mua với user_id, book_id, ngày mua, số tiền, phương thức thanh toán, trạng thái thanh toán.
- **Download**: Link download với purchase_id, token, trạng thái (active/used/expired), ngày tạo, ngày sử dụng.
- **MonthlyQuota**: Tracking quota với user_id, tháng (YYYY-MM), số ebook đã mua, số audiobook đã mua.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: User có thể duyệt và mua sách trong vòng 5 phút từ khi vào trang.
- **SC-002**: Hệ thống chính xác giới hạn user mua tối đa 2 ebook + 2 audiobook/tháng với độ chính xác 100%.
- **SC-003**: Link download bị vô hiệu hóa ngay sau khi tải thành công với độ tin cậy 100%.
- **SC-004**: Trang load hoàn tất trong vòng 3 giây trên kết nối 3G.
- **SC-005**: Giao diện hiển thị đúng trên các thiết bị từ màn hình 320px đến 1920px.
- **SC-006**: Thanh toán qua PayPal và Stripe hoàn tất trong vòng 30 giây (không tính thời gian user nhập thông tin).
- **SC-007**: Admin có thể upload sách mới trong vòng 2 phút.
- **SC-008**: 95% user hoàn thành quy trình mua hàng lần đầu mà không cần hỗ trợ.
- **SC-009**: Quota reset chính xác vào đầu mỗi tháng với độ tin cậy 100%.

## Clarifications

### Session 2025-12-07

- Q: File storage strategy cho ebook/audiobook? → A: Google Cloud Storage
- Q: Maximum file size limit? → A: 2GB (audiobook dài, chất lượng cao)
- Q: Guest browsing capability? → A: Guest có thể xem danh sách sách, chỉ cần đăng nhập khi mua

## Assumptions

- Giá mỗi cuốn sách là 1 EUR (theo tên miền ebook1eur.com).
- Trang sử dụng tiếng Việt làm ngôn ngữ chính.
- File ebook định dạng phổ biến (PDF, EPUB).
- File audiobook định dạng phổ biến (MP3, M4A).
- User cần xác thực email trước khi mua hàng.
- Thời gian hiệu lực của link download là 24 giờ hoặc cho đến khi tải thành công, tùy điều kiện nào đến trước.
