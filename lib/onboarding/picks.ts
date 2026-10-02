import { createClient } from "@/lib/supabase/client";
import type { LearningPath } from "@/lib/types";
import {
  overlayPathOnPick,
  picksFromLaunchCatalog,
} from "./catalogPicks";
import type {
  FluencyLevel,
  OnboardingPick,
  ProfessionalFunction,
} from "./types";

interface CatalogResponse {
  catalog?: LearningPath[];
}

function mapPickRow(row: Record<string, unknown>): OnboardingPick {
  return {
    id: String(row.id ?? ""),
    path_id: typeof row.path_id === "string" ? row.path_id : null,
    function: String(row.function ?? ""),
    fluency_level: String(row.fluency_level ?? ""),
    path_topic: String(row.path_topic ?? ""),
    display_title: String(row.display_title ?? ""),
    display_description: String(row.display_description ?? ""),
    time_estimate_min: Number(row.time_estimate_min ?? 30),
    module_count: Number(row.module_count ?? 1),
    tool_names: Array.isArray(row.tool_names)
      ? row.tool_names.filter((name): name is string => typeof name === "string")
      : [],
    sort_order: Number(row.sort_order ?? 0),
  };
}

async function fetchLaunchCatalog(): Promise<LearningPath[]> {
  try {
    const res = await fetch("/api/missions/catalog");
    if (!res.ok) return [];
    const data = (await res.json()) as CatalogResponse;
    return Array.isArray(data.catalog) ? data.catalog : [];
  } catch {
    return [];
  }
}

function enrichPick(
  pick: OnboardingPick,
  catalogById: Map<string, LearningPath>,
): OnboardingPick {
  if (!pick.path_id) return pick;
  const path = catalogById.get(pick.path_id);
  return path ? overlayPathOnPick(pick, path) : pick;
}

/**
 * Fetch onboarding picks for a function × fluency combination.
 *
 * Prefers editorial rows that already have a real path_id. If those rows
 * are missing (or path_id has not been migrated yet), falls back to the
 * published launch catalog so the golden path still works.
 */
export async function fetchOnboardingPicks(
  primaryFunction: ProfessionalFunction,
  fluencyLevel: FluencyLevel,
  secondaryFunctions: ProfessionalFunction[] = [],
): Promise<{ hero: OnboardingPick | null; also: OnboardingPick[] }> {
  const catalog = await fetchLaunchCatalog();
  const catalogById = new Map(catalog.map((path) => [path.id, path]));
  const catalogFallback = picksFromLaunchCatalog(catalog, fluencyLevel);

  const supabase = createClient();

  const { data: primaryPicks } = await supabase
    .from("fp_onboarding_picks")
    .select("*")
    .eq("function", primaryFunction)
    .eq("fluency_level", fluencyLevel)
    .order("sort_order", { ascending: true })
    .limit(3);

  let hero: OnboardingPick | null = null;
  let also: OnboardingPick[] = [];

  if (primaryPicks && primaryPicks.length > 0) {
    const mapped = (primaryPicks as Record<string, unknown>[]).map(mapPickRow);
    hero = enrichPick(mapped[0], catalogById);
    also = mapped.slice(1).map((pick) => enrichPick(pick, catalogById));
  }

  if (also.length < 2 && secondaryFunctions.length > 0) {
    const needed = 2 - also.length;
    const { data: secondaryPicks } = await supabase
      .from("fp_onboarding_picks")
      .select("*")
      .in("function", secondaryFunctions)
      .eq("fluency_level", fluencyLevel)
      .eq("sort_order", 0)
      .limit(needed);

    if (secondaryPicks) {
      also = [
        ...also,
        ...(secondaryPicks as Record<string, unknown>[])
          .map(mapPickRow)
          .map((pick) => enrichPick(pick, catalogById)),
      ];
    }
  }

  if (!hero) {
    const { data: fallbackPicks } = await supabase
      .from("fp_onboarding_picks")
      .select("*")
      .eq("function", primaryFunction)
      .order("sort_order", { ascending: true })
      .limit(3);

    if (fallbackPicks && fallbackPicks.length > 0) {
      const mapped = (fallbackPicks as Record<string, unknown>[]).map(
        mapPickRow,
      );
      hero = enrichPick(mapped[0], catalogById);
      also = mapped
        .slice(1)
        .map((pick) => enrichPick(pick, catalogById))
        .slice(0, 2);
    }
  }

  if (!hero?.path_id) {
    return catalogFallback;
  }

  const alsoWithPaths = also.filter((pick) => Boolean(pick.path_id)).slice(0, 2);
  if (alsoWithPaths.length === 0 && catalogFallback.also.length > 0) {
    return {
      hero,
      also: catalogFallback.also.filter((pick) => pick.path_id !== hero.path_id),
    };
  }

  return { hero, also: alsoWithPaths };
}
