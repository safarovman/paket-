"use client";
import { forwardRef, InputHTMLAttributes, ReactNode, useState } from "react";
import clsx from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  suffix?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, suffix, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && <label className="text-text-gray text-sm font-medium">{label}</label>}
        <div className="relative flex items-center">
          {icon && (
            <span className="absolute left-4 text-text-gray pointer-events-none">{icon}</span>
          )}
          <input
            ref={ref}
            className={clsx(
              "w-full bg-card border rounded-xl px-4 py-3 text-text-light placeholder-text-gray outline-none transition-all duration-200",
              "focus:border-cyan focus:ring-1 focus:ring-cyan/20",
              error ? "border-red" : "border-border",
              icon && "pl-11",
              suffix && "pr-12",
              className
            )}
            {...props}
          />
          {suffix && (
            <span className="absolute right-4 text-text-gray">{suffix}</span>
          )}
        </div>
        {error && <p className="text-red text-xs">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
export default Input;
