import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";
import { useTrackerSetupSave } from "./useTrackerSetupSave";
import {
  saveAiVisibilityTracker,
  setAiVisibilitySchedule,
} from "@/serverFunctions/ai-visibility";
import type { AiTrackerState } from "@/shared/ai-visibility";

vi.mock("@/serverFunctions/ai-visibility", () => ({
  saveAiVisibilityTracker: vi.fn(),
  setAiVisibilitySchedule: vi.fn(),
  getAiVisibilityTracker: vi.fn(),
}));
const state: AiTrackerState = {
  configured: false,
  tracker: null,
  topics: [],
  prompts: [],
  brands: [],
  engines: [],
  capabilities: [],
  recentRuns: [],
  providerConfigured: false,
};
beforeEach(() => {
  vi.mocked(saveAiVisibilityTracker).mockResolvedValue({
    state,
    created: 1,
    updated: 0,
    skipped: 0,
  });
});
function mutation(startPaused: boolean) {
  let result: ReturnType<typeof useTrackerSetupSave> | undefined;
  function Harness() {
    result = useTrackerSetupSave({
      projectId: "project",
      startPaused,
      onSaved: vi.fn(),
    });
    return null;
  }
  renderToStaticMarkup(
    createElement(
      QueryClientProvider,
      { client: new QueryClient() },
      createElement(Harness),
    ),
  );
  if (!result) throw new Error("Hook was not rendered");
  return result;
}
const accepted = {
  patch: { prompts: [{ text: "Welche Sportnahrung?" }] },
  estimate: null,
};
it("ignores a schedule request in manual mode and sends startPaused to the server", async () => {
  await mutation(true).mutateAsync({ accepted, scheduleWeekly: true });
  expect(saveAiVisibilityTracker).toHaveBeenCalledWith({
    data: { projectId: "project", ...accepted.patch, startPaused: true },
  });
  expect(setAiVisibilitySchedule).not.toHaveBeenCalled();
});
it("preserves explicit scheduling outside manual mode", async () => {
  vi.mocked(setAiVisibilitySchedule).mockResolvedValue({ state, run: null });
  await mutation(false).mutateAsync({ accepted, scheduleWeekly: true });
  expect(setAiVisibilitySchedule).toHaveBeenCalledOnce();
});
it("propagates a save failure without attempting collection", async () => {
  vi.mocked(saveAiVisibilityTracker).mockRejectedValue(
    new Error("Storage unavailable"),
  );
  await expect(
    mutation(true).mutateAsync({ accepted, scheduleWeekly: true }),
  ).rejects.toThrow("Storage unavailable");
  expect(setAiVisibilitySchedule).not.toHaveBeenCalled();
});
