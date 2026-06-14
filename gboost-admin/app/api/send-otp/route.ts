import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// OTP xotirasi (real loyihada Redis ishlatiladi)
const otpStore = new Map<string, { otp: string; expires: number; attempts: number }>();

// Gmail transporter
function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,   // superadmin@gboost.uz yoki boshqa gmail
      pass: process.env.GMAIL_PASS,   // Gmail App Password (16 ta belgi)
    },
  });
}

// OTP generatsiya
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST — OTP yuborish
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    // Super Admin emailini tekshirish
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "superadmin@gboost.uz";
    if (email !== superAdminEmail) {
      return NextResponse.json(
        { success: false, error: "Bu email super admin emas!" },
        { status: 403 }
      );
    }

    // Rate limiting — 1 daqiqada 1 marta
    const existing = otpStore.get(email);
    if (existing && Date.now() < existing.expires - 4 * 60 * 1000) {
      return NextResponse.json(
        { success: false, error: "OTP allaqachon yuborilgan. 1 daqiqa kutib turing." },
        { status: 429 }
      );
    }

    // Yangi OTP
    const otp = generateOTP();
    otpStore.set(email, {
      otp,
      expires: Date.now() + 5 * 60 * 1000, // 5 daqiqa
      attempts: 0,
    });

    // Gmail yuborish manzili (Super Adminning shaxsiy Gmail si)
    const sendToEmail = process.env.SUPER_ADMIN_PERSONAL_EMAIL || email;

    // Gmail orqali yuborish
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"GBoost Admin" <${process.env.GMAIL_USER}>`,
      to: sendToEmail,
      subject: "🔐 GBoost Admin — Kirish Kodi",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Inter, Arial, sans-serif; background: #0A0F1E; margin: 0; padding: 20px; }
            .container { max-width: 480px; margin: 0 auto; background: #111827; border-radius: 20px; overflow: hidden; border: 1px solid #1F2937; }
            .header { background: linear-gradient(135deg, #7C3AED, #00E5FF); padding: 30px; text-align: center; }
            .header h1 { color: white; font-size: 28px; font-weight: 900; margin: 0; letter-spacing: 2px; }
            .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 13px; }
            .body { padding: 32px; text-align: center; }
            .body p { color: #9CA3AF; font-size: 14px; margin: 0 0 24px; line-height: 1.6; }
            .otp-box { background: #0A0F1E; border: 2px solid #00E5FF; border-radius: 16px; padding: 24px; margin: 24px 0; }
            .otp-code { font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #00E5FF; font-family: monospace; }
            .timer { color: #F59E0B; font-size: 13px; font-weight: 600; margin-top: 12px; }
            .warning { background: #EF444415; border: 1px solid #EF444430; border-radius: 12px; padding: 14px; margin-top: 20px; }
            .warning p { color: #EF4444; font-size: 12px; margin: 0; }
            .footer { padding: 20px; border-top: 1px solid #1F2937; text-align: center; }
            .footer p { color: #4B5563; font-size: 11px; margin: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>GBoost</h1>
              <p>Admin Panel — Kirish Tasdiqlash</p>
            </div>
            <div class="body">
              <p>Super Admin paneliga kirish uchun quyidagi <strong style="color:#E5E7EB">bir martalik kodni</strong> kiriting:</p>
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
                <div class="timer">⏱ 5 daqiqa ichida amal qiladi</div>
              </div>
              <div class="warning">
                <p>⚠️ Bu kodni hech kimga bermang! Agar siz so'ramagan bo'lsangiz, bu xabarni e'tiborsiz qoldiring.</p>
              </div>
            </div>
            <div class="footer">
              <p>© 2024 GBoost Admin Panel • Bu xabar avtomatik yuborilgan</p>
              <p style="margin-top:6px; color:#374151;">🔒 Google'da indekslanmaydi</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return NextResponse.json({
      success: true,
      message: `Kod ${sendToEmail} ga yuborildi`,
      // Faqat development da ko'rsatiladi
      ...(process.env.NODE_ENV === "development" ? { _dev_otp: otp } : {}),
    });

  } catch (err: any) {
    console.error("OTP yuborishda xatolik:", err);
    return NextResponse.json(
      { success: false, error: "Email yuborishda xatolik. Gmail sozlamalarini tekshiring." },
      { status: 500 }
    );
  }
}

// PUT — OTP tekshirish
export async function PUT(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    const stored = otpStore.get(email);
    if (!stored) {
      return NextResponse.json(
        { success: false, error: "OTP topilmadi. Qayta yuborish tugmasini bosing." },
        { status: 400 }
      );
    }

    if (Date.now() > stored.expires) {
      otpStore.delete(email);
      return NextResponse.json(
        { success: false, error: "OTP muddati o'tgan. Qayta yuborish tugmasini bosing." },
        { status: 400 }
      );
    }

    if (stored.attempts >= 3) {
      otpStore.delete(email);
      return NextResponse.json(
        { success: false, error: "Juda ko'p noto'g'ri urinish. Qayta yuborish tugmasini bosing." },
        { status: 429 }
      );
    }

    if (stored.otp !== otp) {
      stored.attempts++;
      return NextResponse.json(
        {
          success: false,
          error: `Noto'g'ri kod. ${3 - stored.attempts} ta urinish qoldi.`,
        },
        { status: 400 }
      );
    }

    // Muvaffaqiyatli — OTP o'chiriladi
    otpStore.delete(email);
    return NextResponse.json({ success: true });

  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Xatolik yuz berdi." },
      { status: 500 }
    );
  }
}
