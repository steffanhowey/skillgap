"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface CheckoutButtonProps {
  price: "individual" | "founding";
  children: string;
  variant?: "primary" | "outline";
  disabled?: boolean;
}

/**
 * Starts Stripe Checkout for an individual price and sends the browser there.
 */
export function CheckoutButton({
  price,
  children,
  variant = "primary",
  disabled = false,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price }),
      });
      if (res.status === 401) {
        window.location.href = "/login?next=/pricing";
        return;
      }
      const data = (await res.json()) as { url?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(
        res.status === 409
          ? "Founding seats are full."
          : "Checkout didn't start.",
      );
      setLoading(false);
    } catch {
      setError("Checkout didn't start.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        variant={variant}
        size="sm"
        fullWidth
        loading={loading}
        disabled={disabled || loading}
        onClick={() => void start()}
      >
        {children}
      </Button>
      {error ? (
        <p className="text-xs text-[var(--sg-coral-500)]">{error}</p>
      ) : null}
    </div>
  );
}
