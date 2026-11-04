import { AiVisibilityRepository as repo } from "../repositories/AiVisibilityRepository";
import type { SaveAiTrackerInput } from "@/types/schemas/ai-visibility";
import { projectPatch } from "./aiVisibilityMutation";
import { getTracker } from "./aiVisibilityState";

/** Saves configuration only. startPaused opts new trackers out of the weekly default. */
export async function saveTracker(input: SaveAiTrackerInput) {
  const { projectId, startPaused, ...patch } = input;
  const current = await repo.getConfiguration(projectId);
  const { rows, created, updated, skipped } = await projectPatch(
    projectId,
    patch,
    current,
  );

  // Only a new tracker explicitly created in paused mode starts disabled.
  // Existing trackers retain their current scheduling configuration.
  if (!current && startPaused === true) {
    rows.tracker.enabled = false;
    rows.tracker.nextCheckAt = null;
  }

  await repo.saveConfiguration(rows);
  return { state: await getTracker({ projectId }), created, updated, skipped };
}
