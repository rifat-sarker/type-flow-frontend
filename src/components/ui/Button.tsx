"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  children: ReactNode;
}

const VARIANT_CLASSES: Record<string, string> = {
  primary: "bg-accent text-bg border-accent hover:bg-[#ff6440]",
  secondary: "bg-panel2 text-text border-border hover:border-accent",
  ghost: "bg-transparent text-dim border-transparent hover:text-text",
};

export function Button({ variant = "primary", className = "", children, ...rest }: ButtonProps) {
  return (
    <button
      className={`px-4 py-2 border-2 font-mono text-sm font-bold uppercase tracking-wide transition-colors disabled:opacity-40 disabled:cursor-not-allowed rounded-none ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
