import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { expect, it, vi } from "vitest";
import { TrackerPromptFields } from "./TrackerPromptFields";
import type { AiTrackerState } from "@/shared/ai-visibility";

vi.mock("@/serverFunctions/ai-visibility", () => ({}));
function renderFields(enabled: boolean) {
  const state: AiTrackerState = {
    configured: true,
    providerConfigured: false,
    tracker: {
      id: "tracker",
      projectId: "project",
      enabled,
      locationCode: 2276,
      languageCode: "de",
      scheduleInterval: "weekly",
      nextCheckAt: null,
      lastSkipReason: null,
      createdAt: "2026-11-03T00:00:00Z",
    },
    topics: ["Sport"],
    prompts: [
      {
        id: "prompt",
        text: "Welche Sportnahrung?",
        topic: "Sport",
        paused: true,
        archived: false,
        branded: false,
        hasResults: false,
      },
    ],
    brands: [],
    engines: ["chatgpt"],
    capabilities: [],
    recentRuns: [],
  };
  return renderToStaticMarkup(
    createElement(
      QueryClientProvider,
      { client: new QueryClient() },
      createElement(TrackerPromptFields, {
        projectId: "project",
        state,
        value: {
          engines: ["chatgpt"],
          locationCode: 2276,
          languageCode: "de",
          topic: { name: "Sport", prompts: [""] },
        },
        onChange: vi.fn(),
        onGeneratingChange: vi.fn(),
      }),
    ),
  );
}
it("does not promise execution when the tracker is disabled", () => {
  const html = renderFields(false);
  expect(html).toContain(
    "saved without automatic collection while tracking is disabled",
  );
  expect(html).toContain("existing prompts stay paused");
  expect(html).not.toContain("will still run");
  expect(html).not.toContain("will be included in scheduled checks");
});
it("explains that only new prompts join an enabled schedule", () => {
  const html = renderFields(true);
  expect(html).toContain(
    "New prompts are active and will be included in scheduled checks",
  );
  expect(html).toContain("existing prompts stay paused");
});
