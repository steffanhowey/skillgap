import { SoloMissionPlayer } from "@/components/learn/SoloMissionPlayer";

export default async function MissionSoloPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ step?: string }>;
}) {
  const { id } = await params;
  const { step } = await searchParams;
  const initialStepIndex =
    step != null && /^\d+$/.test(step) ? Number.parseInt(step, 10) : null;

  return (
    <SoloMissionPlayer
      key={id}
      pathId={id}
      initialStepIndex={initialStepIndex}
    />
  );
}
