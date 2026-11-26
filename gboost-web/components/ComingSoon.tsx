import Link from "next/link";

/** "Tez kunda" bloki */
export default function ComingSoon({ icon, title, text, back = true }: { icon: string; title: string; text: string; back?: boolean }) {
  return (
    <div className="wrap py-16">
      <div className="panel max-w-lg mx-auto p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 0%, rgba(255,200,61,.35), transparent 60%)" }} />
        <p className="relative text-5xl">{icon}</p>
        <span className="relative chip bg-accent/15 text-accent mt-3">Tez kunda</span>
        <h1 className="relative h-title mt-3">{title}</h1>
        <p className="relative text-muted text-sm mt-2">{text}</p>
        {back && <Link href="/" className="relative btn-accent mt-6">Akkauntlarga qaytish</Link>}
      </div>
    </div>
  );
}
