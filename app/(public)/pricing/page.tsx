import type { Metadata } from "next";
import { PublicNav } from "@/components/public/PublicNav";
import { Card } from "@/components/ui/Card";
import { CheckoutButton } from "@/components/billing/CheckoutButton";
import { KickoffButton } from "@/components/billing/KickoffButton";
import { foundingSeatsRemaining } from "@/lib/billing/plan";

export const metadata: Metadata = {
  title: "Pricing | SkillGap.ai",
};

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const foundingLeft = await foundingSeatsRemaining();
  const kickoffUrl = process.env.KICKOFF_PAYMENT_LINK_URL || null;

  return (
    <div className="min-h-screen" style={{ background: "var(--sg-white)" }}>
      <PublicNav />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-[var(--sg-shell-900)]">
          Pricing
        </h1>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <Card className="flex flex-col gap-6 p-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-[var(--sg-shell-900)]">
                Individual
              </h2>
              <p className="text-2xl font-semibold text-[var(--sg-shell-900)]">
                $49
                <span className="text-sm font-medium text-[var(--sg-shell-500)]">
                  /month
                </span>
              </p>
            </div>
            <CheckoutButton price="individual">Start monthly</CheckoutButton>
            <div className="space-y-3">
              <p className="text-sm text-[var(--sg-shell-600)]">
                Founding annual · $468 · {foundingLeft} of 100 left
              </p>
              <CheckoutButton
                price="founding"
                variant="outline"
                disabled={foundingLeft <= 0}
              >
                Founding annual
              </CheckoutButton>
            </div>
          </Card>

          <Card className="flex flex-col gap-6 p-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-[var(--sg-shell-900)]">
                Kickoff
              </h2>
              <p className="text-2xl font-semibold text-[var(--sg-shell-900)]">
                $1,500
              </p>
            </div>
            <KickoffButton href={kickoffUrl}>Book the kickoff</KickoffButton>
          </Card>

          <Card className="flex flex-col gap-6 p-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-[var(--sg-shell-900)]">
                Team
              </h2>
              <p className="text-2xl font-semibold text-[var(--sg-shell-900)]">
                $49
                <span className="text-sm font-medium text-[var(--sg-shell-500)]">
                  /seat/month
                </span>
              </p>
              <p className="text-sm leading-6 text-[var(--sg-shell-600)]">
                Seats open after the kickoff.
              </p>
            </div>
            <KickoffButton href={kickoffUrl}>Book the kickoff</KickoffButton>
          </Card>
        </div>
      </main>
    </div>
  );
}
