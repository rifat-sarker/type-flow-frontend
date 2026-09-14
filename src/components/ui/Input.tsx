"use client";

import { InputHTMLAttributes, forwardRef } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = "", ...rest },
  ref
) {
  return (
    <input
      ref={ref}
      className={`w-full bg-panel2 border-2 border-border text-text placeholder:text-dim px-3 py-2 font-mono text-sm rounded-none focus:outline-none focus:border-accent ${className}`}
      {...rest}
    />
  );
});
