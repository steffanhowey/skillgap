import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@/lib/supabase/admin";
import { getStripe, siteOrigin } from "@/lib/billing/stripe";

/**
 * POST /api/billing/portal
 * Returns a Stripe Customer Portal URL for the signed-in user.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "billing_unconfigured" }, { status: 503 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("fp_profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  const customerId =
    !error && typeof data?.stripe_customer_id === "string"
      ? data.stripe_customer_id
      : null;

  if (!customerId) {
    return NextResponse.json({ error: "no_customer" }, { status: 409 });
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${siteOrigin(request)}/settings`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[billing] portal session failed", err);
    return NextResponse.json({ error: "portal_failed" }, { status: 502 });
  }
}
