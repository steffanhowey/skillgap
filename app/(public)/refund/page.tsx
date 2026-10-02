import type { Metadata } from "next";
import { PublicNav } from "@/components/public/PublicNav";

export const metadata: Metadata = {
  title: "Refund policy | SkillGap.ai",
};

export default function RefundPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--sg-white)" }}>
      <PublicNav />
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-[var(--sg-shell-900)]">
          Refund policy
        </h1>
      </main>
    </div>
  );
}
