import { Resend } from "resend";

let resend: Resend | null = null;

function getResend() {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not defined");
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

const FROM_EMAIL = process.env.EMAIL_FROM || "noreply@ebook1eur.com";

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<boolean> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Đặt lại mật khẩu - ebook1eur",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #5D4037;">Đặt lại mật khẩu</h2>
          <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản ebook1eur của mình.</p>
          <p>Nhấn vào nút bên dưới để đặt lại mật khẩu:</p>
          <a href="${resetLink}" 
             style="display: inline-block; background-color: #5D4037; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
            Đặt lại mật khẩu
          </a>
          <p style="color: #666; font-size: 14px;">
            Link này sẽ hết hạn sau 1 giờ.
          </p>
          <p style="color: #666; font-size: 14px;">
            Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px;">
            © ${new Date().getFullYear()} ebook1eur. All rights reserved.
          </p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    return false;
  }
}

export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<boolean> {
  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Chào mừng đến với ebook1eur!",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #5D4037;">Chào mừng ${name}!</h2>
          <p>Cảm ơn bạn đã đăng ký tài khoản tại ebook1eur.</p>
          <p>Bạn có thể mua tối đa <strong>2 ebook</strong> và <strong>2 sách nói</strong> mỗi tháng với giá chỉ €1/quyển.</p>
          <p>Bắt đầu khám phá kho sách của chúng tôi ngay!</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/books" 
             style="display: inline-block; background-color: #5D4037; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
            Khám phá sách
          </a>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px;">
            © ${new Date().getFullYear()} ebook1eur. All rights reserved.
          </p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    return false;
  }
}
