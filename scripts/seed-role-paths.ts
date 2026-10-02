import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { config } from "dotenv";
import {
  compileRolePath,
  rolePathHasTodo,
  rolePathSeedSchema,
  type RolePathSeed,
} from "../content/role-paths/types.ts";

config({ path: path.join(process.cwd(), ".env.local") });

/**
 * Upserts every role-path file. Refuses the run while any mission still says TODO.
 */
async function main(): Promise<void> {
  const dir = path.join(process.cwd(), "content/role-paths");
  const files = (await readdir(dir)).filter(
    (file) => file.endsWith(".ts") && file !== "types.ts",
  );

  const seeds: RolePathSeed[] = [];
  for (const file of files) {
    const imported = (await import(pathToFileURL(path.join(dir, file)).href)) as Record<
      string,
      unknown
    >;
    const candidate = Object.values(imported).find(
      (value) => value && typeof value === "object" && "missions" in value,
    );
    const parsed = rolePathSeedSchema.safeParse(candidate);
    if (!parsed.success) {
      console.error(`seed:role-paths refused ${file}: invalid shape`);
      process.exit(1);
    }
    if (rolePathHasTodo(parsed.data)) {
      console.error(`seed:role-paths refused ${file}: a mission still contains TODO`);
      process.exit(1);
    }
    seeds.push(parsed.data);
  }

  const { createClient } = await import("../lib/supabase/admin");
  const admin = createClient();

  for (const seed of seeds) {
    const compiled = compileRolePath(seed);
    const { error } = await admin.from("fp_learning_paths").upsert(
      {
        slug: compiled.slug,
        title: compiled.title,
        description: compiled.description,
        query: compiled.title,
        topics: compiled.topics,
        items: compiled.items,
        modules: compiled.modules,
        estimated_duration_seconds: compiled.estimated_duration_seconds,
        is_role_path: true,
        role_function: compiled.role_function,
        status: "approved",
        review_status: "approved",
        is_discoverable: true,
        is_cached: true,
        canonical_stable_key: `role:${compiled.slug}`,
        generation_source: "role_path_seed",
      },
      { onConflict: "slug" },
    );
    if (error) {
      console.error(`seed:role-paths failed for ${compiled.slug}`);
      process.exit(1);
    }
    console.log(`seeded ${compiled.slug}`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "seed:role-paths failed");
  process.exit(1);
});
