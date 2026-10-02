"use client";

import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { IntegrationSettings } from "@/components/settings/IntegrationSettings";

export default function SettingsPage() {
  return (
    <main className="flex-1">
      <ProfileSettings />
      <IntegrationSettings />
    </main>
  );
}
