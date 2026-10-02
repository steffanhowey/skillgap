import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { LaunchMessagingPlayer } from "@/components/learn/LaunchMessagingPlayer";
import { LAUNCH_MESSAGING_ROUTE } from "@/lib/appRoutes";
import { getTrackFAccess } from "@/lib/learn/wedge/access";

export const metadata: Metadata = {
  title: "Launch messaging | SkillGap",
  description: "Confirm launch context, build a message matrix, and review it against the proof you supplied.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function LaunchMessagingPage() {
  const access = await getTrackFAccess();

  if (access.status === "unauthenticated") {
    redirect(`/login?next=${LAUNCH_MESSAGING_ROUTE}`);
  }
  if (access.status === "forbidden") {
    notFound();
  }

  return <LaunchMessagingPlayer />;
}
