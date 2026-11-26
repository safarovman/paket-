/** Rasm bo'lmasa — chizilgan keys */
export default function CaseArt({ color, icon, size = 112 }: { color: string; icon: string; size?: number }) {
  return (
    <div className="relative" style={{ width: size, height: size * 0.8 }}>
      <div className="absolute inset-0 rounded-2xl border-2 shadow-2xl"
        style={{ borderColor: color, background: `linear-gradient(160deg, ${color}55, #050706 80%)`, boxShadow: `0 10px 40px -8px ${color}` }} />
      <div className="absolute left-0 right-0 top-[38%] h-[3px]" style={{ background: color }} />
      <div className="absolute inset-0 grid place-items-center text-4xl">{icon}</div>
    </div>
  );
}
