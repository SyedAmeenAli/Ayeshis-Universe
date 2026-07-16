import React from "react";
import { Link } from "react-router-dom";
import { useMagnetic } from "@/hooks/useMagnetic";

/**
 * Magnetic pill/rectangular button.
 * Accepts either `to` (react-router Link) or `onClick`.
 */
export function MagneticButton({
  children,
  to,
  onClick,
  variant = "primary",
  size = "md",
  type = "button",
  className = "",
  disabled = false,
  "data-testid": testId,
  ...rest
}) {
  const { ref, onMouseMove, onMouseLeave } = useMagnetic({ strength: 0.28, max: 8 });

  const base = "magnetic inline-flex items-center justify-center gap-2 font-ui font-medium tracking-tight uppercase text-xs transition-colors duration-200 disabled:opacity-40 disabled:pointer-events-none";
  const sizes = {
    sm: "px-4 py-2 rounded-full",
    md: "px-6 py-3 rounded-full",
    lg: "px-8 py-4 rounded-full text-sm",
  };
  const variants = {
    primary: "bg-lavender text-archive hover:bg-lavender-soft",
    ghost: "bg-transparent border border-lavender/30 text-lavender hover:border-lavender/70 hover:bg-lavender/5",
    ivory: "bg-ivory text-archive hover:bg-tulip",
    danger: "bg-transparent border border-white/10 text-text-secondary hover:text-text-primary hover:border-white/25",
  };

  const cls = `${base} ${sizes[size]} ${variants[variant]} ${className}`;

  const props = {
    className: cls,
    onMouseMove,
    onMouseLeave,
    "data-testid": testId,
    ...rest,
  };

  if (to) {
    return (
      <Link ref={ref} to={to} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <button ref={ref} type={type} onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  );
}
