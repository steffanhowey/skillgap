"use client";

import { Button } from "@/components/ui/Button";

interface KickoffButtonProps {
  href: string | null;
  children: string;
}

/**
 * Opens the Stripe Payment Link for the kickoff. Disabled when the link is unset.
 */
export function KickoffButton({ href, children }: KickoffButtonProps) {
  return (
    <Button
      variant="primary"
      size="sm"
      fullWidth
      disabled={!href}
      onClick={() => {
        if (href) window.location.href = href;
      }}
    >
      {children}
    </Button>
  );
}
