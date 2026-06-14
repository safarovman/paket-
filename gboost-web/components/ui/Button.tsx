"use client";
import { ReactNode } from "react";
import clsx from "clsx";

interface Props {
  children: ReactNode;
  variant?: "primary" | "outline" | "ghost" | "danger" | "gold";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  fullWidth?: boolean;
}

export default function Button({
  children, variant = "primary", size = "md",
  className, onClick, disabled, type = "button", fullWidth,
}: Props) {
  const base = "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-gradient-primary text-white shadow-cyan hover:opacity-90 hover:scale-[1.02]",
    outline: "border border-cyan/50 text-cyan bg-cyan/5 hover:bg-cyan/10 hover:border-cyan",
    ghost:   "text-text-gray hover:bg-card hover:text-text-light",
    danger:  "bg-red/90 text-white hover:bg-red",
    gold:    "bg-gradient-gold text-bg font-bold shadow-gold hover:opacity-90",
  };

  const sizes = {
    sm: "text-sm px-4 py-2",
    md: "text-sm px-5 py-3",
    lg: "text-base px-7 py-3.5",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={clsx(base, variants[variant], sizes[size], fullWidth && "w-full", className)}
    >
      {children}
    </button>
  );
}
