import Stripe from "stripe";

let stripeClient: Stripe | null = null;

/**
 * Stripe client for server routes. Returns null when STRIPE_SECRET_KEY is unset
 * so callers can fail the request instead of crashing the process.
 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export type CheckoutPrice = "individual" | "founding";

export type PaidPlan = "individual" | "founding" | "team";

/**
 * Stripe Price id for a checkout door. Team checkout is not wired yet.
 */
export function priceIdFor(price: CheckoutPrice): string | null {
  const value =
    price === "individual"
      ? process.env.STRIPE_PRICE_INDIVIDUAL_MONTHLY
      : process.env.STRIPE_PRICE_FOUNDING_ANNUAL;
  return value && value.length > 0 ? value : null;
}

/**
 * Map a Stripe Price id back to a plan. Unknown prices return null.
 */
export function planForPriceId(priceId: string): PaidPlan | null {
  if (priceId === process.env.STRIPE_PRICE_INDIVIDUAL_MONTHLY) return "individual";
  if (priceId === process.env.STRIPE_PRICE_FOUNDING_ANNUAL) return "founding";
  if (priceId === process.env.STRIPE_PRICE_TEAM_SEAT_MONTHLY) return "team";
  return null;
}

/**
 * Absolute site origin for Stripe success, cancel, and portal return URLs.
 */
export function siteOrigin(request: Request): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (configured && configured.length > 0) {
    return configured.replace(/\/$/, "");
  }
  return new URL(request.url).origin;
}
