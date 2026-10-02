import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@/lib/supabase/admin";
import { foundingSeatsRemaining } from "@/lib/billing/plan";
import {
  getStripe,
  priceIdFor,
  siteOrigin,
  type CheckoutPrice,
} from "@/lib/billing/stripe";

function parsePrice(body: unknown): CheckoutPrice | null {
  if (!body || typeof body !== "object") return null;
  const price = (body as { price?: unknown }).price;
  if (price === "individual" || price === "founding") return price;
  return null;
}

/**
 * POST /api/billing/checkout
 * Starts a Stripe Checkout subscription for individual monthly or founding annual.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const price = parsePrice(body);
  if (!price) {
    return NextResponse.json({ error: "invalid_price" }, { status: 400 });
  }

  if (price === "founding") {
    const remaining = await foundingSeatsRemaining();
    if (remaining <= 0) {
      return NextResponse.json({ error: "founding_full" }, { status: 409 });
    }
  }

  const stripe = getStripe();
  const priceId = priceIdFor(price);
  if (!stripe || !priceId) {
    return NextResponse.json({ error: "billing_unconfigured" }, { status: 503 });
  }

  const origin = siteOrigin(request);
  let customerId: string | null = null;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("fp_profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();
    if (typeof data?.stripe_customer_id === "string" && data.stripe_customer_id) {
      customerId = data.stripe_customer_id;
    }
  } catch (err) {
    console.error("[billing] checkout customer lookup failed", err);
  }

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    client_reference_id: user.id,
    allow_promotion_codes: true,
    success_url: `${origin}/home?welcome=1`,
    cancel_url: `${origin}/pricing`,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { user_id: user.id, plan: price },
    subscription_data: {
      metadata: { user_id: user.id, plan: price },
    },
  };

  if (customerId) {
    params.customer = customerId;
  } else if (user.email) {
    params.customer_email = user.email;
  }

  try {
    const session = await stripe.checkout.sessions.create(params);
    if (!session.url) {
      return NextResponse.json({ error: "checkout_failed" }, { status: 502 });
    }
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[billing] checkout session failed", err);
    return NextResponse.json({ error: "checkout_failed" }, { status: 502 });
  }
}
