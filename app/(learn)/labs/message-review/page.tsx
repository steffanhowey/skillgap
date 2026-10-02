import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { MessageReviewPrototype } from "@/components/labs/MessageReviewPrototype";
import { getMessageReviewLabAccess } from "@/lib/labs/messageReview/access";

export const metadata: Metadata = {
  title: "Message Review | SkillGap",
  description:
    "Check a marketing draft against its approved context and evidence.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function MessageReviewLabPage() {
  const access = await getMessageReviewLabAccess();

  if (access.status === "unauthenticated") {
    redirect("/login?next=/labs/message-review");
  }
  if (access.status === "forbidden") {
    notFound();
  }

  return <MessageReviewPrototype />;
}
