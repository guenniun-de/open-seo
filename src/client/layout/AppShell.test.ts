import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";
import { AuthenticatedAppLayout } from "./AppShell";
import { aiTrackerQueryOptions } from "@/client/features/ai-visibility/shared";
import type { AiTrackerState } from "@/shared/ai-visibility";

const location = vi.hoisted(() => ({ pathname: "/p/project/ai-visibility" }));
vi.mock("@tanstack/react-router", () => ({
  useLocation: () => location,
  Link: () => null,
  linkOptions: (value: unknown) => value,
}));
vi.mock("@/serverFunctions/config", () => ({ getSeoApiKeyStatus: vi.fn() }));
vi.mock("@/serverFunctions/ai-visibility", () => ({
  getAiVisibilityTracker: vi.fn(),
}));
vi.mock("@/client/features/projects/projectQueries", () => ({
  projectsQueryOptions: () => ({
    queryKey: ["projects"],
    queryFn: async () => [],
  }),
}));
vi.mock("@/client/lib/active-project", () => ({
  getLastProjectId: () => "project",
}));
vi.mock("@/client/components/Sidebar", () => ({ Sidebar: () => null }));
vi.mock("@/client/features/gsc/GscReEngagementModal", () => ({
  GscReEngagementModal: () => null,
}));
vi.mock("@/client/components/ui/sidebar", () => ({
  SidebarProvider: ({ children }: { children: React.ReactNode }) => children,
  SidebarInset: ({ children }: { children: React.ReactNode }) => children,
  SidebarTrigger: () => null,
}));
vi.mock("./AppShellParts", () => ({
  LegacyDockerBanner: () => null,
  MissingSeoSetupModal: () => "Provider setup modal",
  SeoApiStatusBanners: ({
    shouldShowSeoApiWarning,
    seoApiKeyStatusError,
  }: {
    shouldShowSeoApiWarning: boolean;
    seoApiKeyStatusError: boolean;
  }) =>
    shouldShowSeoApiWarning || seoApiKeyStatusError
      ? "DataForSEO setup warning"
      : null,
}));

beforeEach(() => {
  location.pathname = "/p/project/ai-visibility";
});
function renderShell(
  enabled: boolean,
  providerConfigured = false,
  providerError = false,
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  client.setQueryData(["seoApiKeyStatus"], { configured: providerConfigured });
  if (providerError)
    client
      .getQueryCache()
      .find({ queryKey: ["seoApiKeyStatus"] })
      ?.setState({ status: "error", error: new Error("Status unavailable") });
  client.setQueryData<Pick<AiTrackerState, "tracker">>(
    aiTrackerQueryOptions("project").queryKey,
    {
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
    },
  );
  const props = {
    projectId: "project",
    ready: true,
    children: "Prompt content",
  };
  return renderToStaticMarkup(
    createElement(
      QueryClientProvider,
      { client },
      createElement(AuthenticatedAppLayout, props),
    ),
  );
}
it.each([
  "/p/project/ai-visibility",
  "/p/project/ai-visibility/",
  "/p/project/ai-visibility/prompts/prompt-id",
])(
  "does not show a global provider warning for paused prompt management at %s",
  (path) => {
    location.pathname = path;
    const html = renderShell(false);
    expect(html).toContain("Prompt content");
    expect(html).not.toContain("DataForSEO setup warning");
    expect(html).not.toContain("Provider setup modal");
  },
);
it("retains global warnings for an active tracker", () => {
  expect(renderShell(true)).toContain("DataForSEO setup warning");
});
it.each([
  "/p/project/keywords",
  "/p/project/domain",
  "/p/project/backlinks",
  "/p/project/rank-tracking/config",
  "/p/project/local-seo/tracker",
  "/p/project/brand-lookup",
  "/p/project/ai-visibility/research",
  "/p/project/prompt-explorer",
])("retains provider warnings for dependent research at %s", (path) => {
  location.pathname = path;
  expect(renderShell(false)).toContain("DataForSEO setup warning");
});
it("does not warn when DataForSEO is configured", () => {
  expect(renderShell(true, true)).not.toContain("DataForSEO setup warning");
});

it.each([
  "/p/project/search-performance", // GSC and GA4 insights share this page.
  "/p/project/settings/integrations",
  "/p/project/settings",
  "/p/project/reports",
  "/p/project/context",
  "/p/project/sam",
  "/p/project/audit",
  "/p/project",
  "/settings",
  "/help/dataforseo-api-key",
])(
  "keeps provider-independent pages free of missing-key and status-error warnings at %s",
  (path) => {
    location.pathname = path;
    for (const providerError of [false, true]) {
      const html = renderShell(true, false, providerError);
      expect(html).toContain("Prompt content");
      expect(html).not.toContain("DataForSEO setup warning");
      expect(html).not.toContain("Provider setup modal");
    }
  },
);
it("retains status-check errors for provider-backed features", () => {
  location.pathname = "/p/project/keywords";
  expect(renderShell(false, false, true)).toContain("DataForSEO setup warning");
});
