import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { expect, it, vi } from "vitest";
import { TrackerEditor, TrackerEditorMode } from "./TrackerEditor";
import type { AiTrackerState } from "@/shared/ai-visibility";

vi.mock("@/serverFunctions/ai-visibility", () => ({}));
vi.mock("@tanstack/react-router", () => ({ Link: () => null }));
// Render portal contents on the server so the test checks the actual editor
// guidance and controls without depending on browser dialog positioning.
vi.mock("@/client/components/ui/dialog", () => {
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- vi.mock factories are hoisted; keep their component local
  const Content = ({ children }: { children: ReactNode }) => children;
  return {
    Dialog: Content,
    DialogContent: Content,
    DialogFooter: Content,
    DialogHeader: Content,
    DialogTitle: Content,
  };
});
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
function renderEditor(mode: TrackerEditorMode, startPaused = false) {
  return renderToStaticMarkup(
    createElement(
      QueryClientProvider,
      { client: new QueryClient() },
      createElement(TrackerEditor, {
        projectId: "project",
        state,
        defaultMarket: { locationCode: 2276, languageCode: "de" },
        mode,
        startPaused,
        onClose: vi.fn(),
        onSaved: vi.fn(),
      }),
    ),
  );
}
it("shows neutral guidance and no dead tracking-settings control in the manual setup", () => {
  const html = renderEditor(TrackerEditorMode.Prompts, true);
  expect(html).toContain(
    "Prompts werden über OpenRouter generiert und ohne automatisches Tracking gespeichert.",
  );
  expect(html).not.toContain("DataForSEO");
  expect(html).not.toContain("Tracking settings");
});
it("keeps provider setup guidance in tracking settings without a key", () => {
  expect(renderEditor(TrackerEditorMode.Settings)).toContain(
    "configure the DataForSEO API key",
  );
});
