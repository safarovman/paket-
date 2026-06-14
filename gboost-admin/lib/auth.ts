// ============================================================
// GBoost Admin — Auth Logic
// ============================================================

export interface AdminSession {
  id: string;
  name: string;
  email: string;
  role: "superadmin" | "admin";
}

// Super Admin ma'lumotlari (real loyihada env variable da bo'ladi)
export const SUPER_ADMIN = {
  email: "superadmin@gboost.uz",
  // Parol: GBoost@Super2024  (bcrypt hash)
  passwordHash: "GBoost@Super2024",
  name: "Super Admin",
  id: "superadmin-001",
};

// OTP store (real loyihada Redis/DB da bo'ladi)
const otpStore = new Map<string, { otp: string; expires: number; attempts: number }>();

// Parol o'zgartirish tarixi (3 kunda 1 marta)
const passwordChangeLog = new Map<string, number>();

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function saveOTP(email: string, otp: string): void {
  otpStore.set(email, {
    otp,
    expires: Date.now() + 5 * 60 * 1000, // 5 daqiqa
    attempts: 0,
  });
}

export function verifyOTP(email: string, inputOtp: string): { valid: boolean; error?: string } {
  const stored = otpStore.get(email);
  if (!stored) return { valid: false, error: "OTP yuborilmagan" };
  if (Date.now() > stored.expires) {
    otpStore.delete(email);
    return { valid: false, error: "OTP muddati o'tgan" };
  }
  if (stored.attempts >= 3) {
    otpStore.delete(email);
    return { valid: false, error: "Ko'p urinish. Qayta so'rang" };
  }
  if (stored.otp !== inputOtp) {
    stored.attempts++;
    return { valid: false, error: `Noto'g'ri kod. ${3 - stored.attempts} urinish qoldi` };
  }
  otpStore.delete(email);
  return { valid: true };
}

export function canChangePassword(adminId: string): { allowed: boolean; hoursLeft?: number } {
  const lastChange = passwordChangeLog.get(adminId);
  if (!lastChange) return { allowed: true };
  const threeDays = 3 * 24 * 60 * 60 * 1000;
  const elapsed = Date.now() - lastChange;
  if (elapsed >= threeDays) return { allowed: true };
  const hoursLeft = Math.ceil((threeDays - elapsed) / (60 * 60 * 1000));
  return { allowed: false, hoursLeft };
}

export function recordPasswordChange(adminId: string): void {
  passwordChangeLog.set(adminId, Date.now());
}

export function formatPrice(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return `${diff} soniya oldin`;
  if (diff < 3600) return `${Math.floor(diff / 60)} daqiqa oldin`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} soat oldin`;
  return `${Math.floor(diff / 86400)} kun oldin`;
}
