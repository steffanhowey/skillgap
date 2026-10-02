import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createClient as createAdminClient } from "@/lib/supabase/admin";
import { getStripe, planForPriceId, type PaidPlan } from "@/lib/billing/stripe";

interface BillingPatch {
  stripe_customer_id?: string;
  plan?: PaidPlan | "free";
  plan_status?: string | null;
  plan_period_end?: string | null;
  is_founding?: true;
}

function asPaidPlan(value: string | undefined): PaidPlan | null {
  if (value === "individual" || value === "founding" || value === "team") {
    return value;
  }
  return null;
}

function customerIdOf(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null
): string | null {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

function periodEndIso(subscription: Stripe.Subscription): string | null {
  const end = subscription.items?.data?.[0]?.current_period_end;
  if (!end) return null;
  return new Date(end * 1000).toISOString();
}

function planFromSubscription(subscription: Stripe.Subscription): PaidPlan | null {
  const fromMetadata = asPaidPlan(subscription.metadata?.plan);
  if (fromMetadata) return fromMetadata;
  const priceId = subscription.items?.data?.[0]?.price?.id;
  return priceId ? planForPriceId(priceId) : null;
}

function statusFor(subscription: Stripe.Subscription): string {
  if (subscription.cancel_at_period_end || subscription.status === "canceled") {
    return "canceled";
  }
  return subscription.status;
}

async function profileIdForCustomer(customerId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("fp_profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .limit(1)
    .maybeSingle();
  return typeof data?.id === "string" ? data.id : null;
}

async function writeBilling(userId: string, patch: BillingPatch): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.from("fp_profiles").update(patch).eq("id", userId);
  if (error) {
    console.error("[billing] profile write failed");
    return false;
  }
  return true;
}

async function onCheckoutCompleted(session: Stripe.Checkout.Session): Promise<boolean> {
  if (session.mode !== "subscription") return true;

  const userId = session.client_reference_id || session.metadata?.user_id || null;
  if (!userId) {
    console.error("[billing] checkout completed without a user id");
    return true;
  }

  const plan = asPaidPlan(session.metadata?.plan);
  const customerId = customerIdOf(session.customer);
  const patch: BillingPatch = {};
  if (customerId) patch.stripe_customer_id = customerId;
  if (plan) patch.plan = plan;
  if (plan === "founding") patch.is_founding = true;

  const stripe = getStripe();
  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
  if (stripe && subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      patch.plan_status = statusFor(subscription);
      patch.plan_period_end = periodEndIso(subscription);
      const fromSub = planFromSubscription(subscription);
      if (!patch.plan && fromSub) patch.plan = fromSub;
      if (fromSub === "founding") patch.is_founding = true;
    } catch (err) {
      console.error("[billing] subscription retrieve failed", err);
      patch.plan_status = "active";
    }
  } else if (plan) {
    patch.plan_status = "active";
  }

  return writeBilling(userId, patch);
}

async function onSubscriptionChanged(
  subscription: Stripe.Subscription,
  deleted: boolean
): Promise<boolean> {
  const customerId = customerIdOf(subscription.customer);
  const userId =
    subscription.metadata?.user_id ||
    (customerId ? await profileIdForCustomer(customerId) : null);
  if (!userId) {
    console.error("[billing] subscription event without a profile");
    return true;
  }

  const plan = planFromSubscription(subscription);
  const patch: BillingPatch = {
    plan_status: deleted ? "canceled" : statusFor(subscription),
    plan_period_end: periodEndIso(subscription),
  };
  if (customerId) patch.stripe_customer_id = customerId;
  if (deleted) {
    patch.plan = "free";
  } else if (plan) {
    patch.plan = plan;
  }
  if (plan === "founding") patch.is_founding = true;

  return writeBilling(userId, patch);
}

/**
 * POST /api/billing/webhook
 * Verifies the Stripe signature and writes plan state on fp_profiles.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "billing_unconfigured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  console.log(`[billing] ${event.id} ${event.type}`);

  let ok = true;
  try {
    switch (event.type) {
      case "checkout.session.completed":
        ok = await onCheckoutCompleted(event.data.object);
        break;
      case "customer.subscription.updated":
        ok = await onSubscriptionChanged(event.data.object, false);
        break;
      case "customer.subscription.deleted":
        ok = await onSubscriptionChanged(event.data.object, true);
        break;
      default:
        break;
    }
  } catch (err) {
    console.error("[billing] webhook handler failed", err);
    return NextResponse.json({ error: "handler_failed" }, { status: 500 });
  }

  if (!ok) {
    return NextResponse.json({ error: "write_failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
