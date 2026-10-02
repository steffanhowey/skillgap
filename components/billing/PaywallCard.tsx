"use client";

import { Card } from "@/components/ui/Card";
import { CheckoutButton } from "@/components/billing/CheckoutButton";

/**
 * Paywall shown inside the mission player when a free plan hits a paid Do step.
 */
export function PaywallCard() {
  return (
    <Card className="space-y-5 p-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-[var(--sg-shell-900)]">
          This step is paid
        </p>
        <p className="text-sm leading-6 text-[var(--sg-shell-600)]">
          The first mission is free. Doing the next one is Individual.
        </p>
      </div>
      <div className="space-y-3">
        <p className="text-sm text-[var(--sg-shell-900)]">$49/month</p>
        <CheckoutButton price="individual">Start monthly</CheckoutButton>
      </div>
      <div className="space-y-3">
        <p className="text-sm text-[var(--sg-shell-900)]">$468/year</p>
        <CheckoutButton price="founding" variant="outline">
          Founding annual
        </CheckoutButton>
      </div>
    </Card>
  );
}
