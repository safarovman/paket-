import { ReactNode } from "react";
import clsx from "clsx";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  borderColor?: string;
  onClick?: () => void;
  padding?: string;
}

export function Card({ children, className, hover, borderColor, onClick, padding = "p-5" }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={borderColor ? { borderColor } : undefined}
      className={clsx(
        "bg-card rounded-2xl border border-border",
        padding,
        hover && "transition-all duration-200 hover:border-cyan/30 hover:shadow-cyan cursor-pointer",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}

export function GradientCard({ children, className, gradient = "from-card to-navy", padding = "p-5" }: {
  children: ReactNode; className?: string; gradient?: string; padding?: string;
}) {
  return (
    <div className={clsx(`bg-gradient-to-br ${gradient} rounded-2xl border border-border`, padding, className)}>
      {children}
    </div>
  );
}

export function StatCard({ label, value, color = "text-cyan" }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={clsx("text-2xl font-bold", color)}>{value}</span>
      <span className="text-text-gray text-xs text-center">{label}</span>
    </div>
  );
}
