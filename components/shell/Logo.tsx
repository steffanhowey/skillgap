"use client";

import Link from "next/link";

/** Nav logo height in pixels. */
const NAV_LOGO_HEIGHT = 28;

interface LogoProps {
  /** Height in pixels. Default 28 for nav, 24 for small variant. */
  height?: number;
  href?: string;
  variant?: "dark" | "light" | "small";
  /** Optional: constrain max width (px). */
  maxWidth?: number;
}

/**
 * Brand wordmark. Public logo PNGs are not provisioned, so this renders
 * the SkillGap.ai mark from the brand kit instead of a missing image.
 */
export function Logo({
  height,
  href = "/",
  variant = "dark",
  maxWidth = 140,
}: LogoProps) {
  const resolvedHeight = height ?? (variant === "small" ? 24 : NAV_LOGO_HEIGHT);
  const fontSize = Math.max(15, Math.round(resolvedHeight * 0.78));
  const isLight = variant === "light";

  const wordmark = (
    <span
      className={`inline-flex items-baseline font-bold tracking-tight ${
        isLight ? "text-white" : "text-[var(--sg-shell-900)]"
      }`}
      style={{ height: resolvedHeight, maxWidth, fontSize }}
    >
      SkillGap
      <span
        className={
          isLight
            ? "text-[var(--sg-forest-300)]"
            : "text-[var(--sg-forest-500)]"
        }
      >
        .ai
      </span>
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex items-center"
        aria-label="SkillGap Home"
      >
        {wordmark}
      </Link>
    );
  }

  return wordmark;
}
