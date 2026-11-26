import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-line mt-16">
      <div className="wrap py-8 flex flex-col sm:flex-row gap-4 items-center justify-between text-sm text-muted">
        <p><span className="font-black text-white">Uz<span className="text-accent">Drop</span></span> © {new Date().getFullYear()} — akkaunt savdosi va spin</p>
        <div className="flex gap-5">
          <Link href="/market" className="hover:text-white">Akkauntlar</Link>
          <Link href="/sell" className="hover:text-white">Sotish</Link>
          <Link href="/wallet" className="hover:text-white">Balans</Link>
          <Link href="/privacy" className="hover:text-white">Maxfiylik</Link>
          <Link href="/terms" className="hover:text-white">Shartlar</Link>
        </div>
      </div>
    </footer>
  );
}
