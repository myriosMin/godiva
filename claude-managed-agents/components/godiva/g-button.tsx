"use client";

import { useState, type ButtonHTMLAttributes, type CSSProperties } from "react";

type GButtonVariant = "primary" | "secondary";

type GButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "style"> & {
  variant?: GButtonVariant;
  style?: CSSProperties;
};

const baseStyle: CSSProperties = {
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 500,
  padding: "8px 14px",
  cursor: "pointer",
  transition: "background-color .15s ease, border-color .15s ease",
  fontFamily: "inherit",
  letterSpacing: ".01em",
};

export function GButton({
  variant = "primary",
  disabled,
  style,
  children,
  type = "button",
  onMouseEnter,
  onMouseLeave,
  ...rest
}: GButtonProps) {
  const [hover, setHover] = useState(false);

  let variantStyle: CSSProperties;
  if (variant === "primary") {
    variantStyle = disabled
      ? {
          background: "var(--gv-bdr)",
          border: "1px solid var(--gv-bdr)",
          color: "#fff",
          cursor: "not-allowed",
          opacity: 0.6,
        }
      : {
          background: hover ? "var(--gv-acc-hover, #734829)" : "var(--gv-acc)",
          border: "1px solid var(--gv-acc)",
          color: "#fff",
        };
  } else {
    variantStyle = disabled
      ? {
          background: "transparent",
          border: "1px solid var(--gv-bdr)",
          color: "var(--gv-tx3)",
          cursor: "not-allowed",
          opacity: 0.6,
        }
      : {
          background: "transparent",
          border: hover
            ? "1px solid var(--gv-tx3)"
            : "1px solid var(--gv-bdr)",
          color: "var(--gv-tx2)",
        };
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onMouseEnter={(e) => {
        setHover(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setHover(false);
        onMouseLeave?.(e);
      }}
      style={{
        ...baseStyle,
        ...variantStyle,
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
