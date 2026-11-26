import Link from "next/link";

export default function LoginCta({ text }: { text: string }) {
  return (
    <div className="wrap py-20 text-center">
      <div className="panel max-w-md mx-auto p-8">
        <div className="text-5xl mb-3">🔐</div>
        <p className="font-extrabold text-lg mb-1">Tizimga kiring</p>
        <p className="text-muted text-sm mb-6">{text}</p>
        <Link href="/login" className="btn-accent w-full">Kirish / Ro&apos;yxatdan o&apos;tish</Link>
      </div>
    </div>
  );
}
