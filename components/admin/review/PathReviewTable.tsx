"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAdminData } from "@/lib/admin/useAdminData";

interface ReviewPath {
  id: string;
  title: string;
  status: string;
  review_status: string;
  generation_source: string | null;
  created_at: string;
}

/**
 * Pending generated paths on the admin review queue.
 */
export function PathReviewTable() {
  const { data, loading, refresh } = useAdminData<{ paths: ReviewPath[] }>(
    "/api/admin/paths/review",
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const paths = data?.paths ?? [];

  async function act(id: string, decision: "approve" | "reject"): Promise<void> {
    setBusyId(id);
    await fetch(`/api/admin/paths/review/${id}/${decision}`, {
      method: "POST",
      credentials: "include",
    });
    setBusyId(null);
    await refresh();
  }

  return (
    <section className="mb-10 space-y-3">
      <h2 className="text-sm font-semibold text-[var(--sg-white)]">Generated paths</h2>
      {loading && paths.length === 0 ? (
        <p className="text-sm text-[var(--sg-shell-500)]">Loading paths...</p>
      ) : null}
      {!loading && paths.length === 0 ? (
        <p className="text-sm text-[var(--sg-shell-500)]">No paths waiting for review.</p>
      ) : null}
      {paths.length > 0 ? (
        <table className="w-full text-left text-sm text-[var(--sg-shell-300)]">
          <thead>
            <tr className="border-b border-white/10 text-xs text-[var(--sg-shell-500)]">
              <th className="py-2 pr-4 font-medium">Title</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 pr-4 font-medium">Source</th>
              <th className="py-2 font-medium"> </th>
            </tr>
          </thead>
          <tbody>
            {paths.map((path) => (
              <tr key={path.id} className="border-b border-white/10">
                <td className="py-3 pr-4 text-[var(--sg-white)]">{path.title}</td>
                <td className="py-3 pr-4">{path.review_status}</td>
                <td className="py-3 pr-4">{path.generation_source ?? "—"}</td>
                <td className="py-3">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="primary"
                      size="xs"
                      disabled={busyId === path.id || path.review_status === "approved"}
                      onClick={() => void act(path.id, "approve")}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="xs"
                      disabled={busyId === path.id || path.review_status === "rejected"}
                      onClick={() => void act(path.id, "reject")}
                    >
                      Reject
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </section>
  );
}
