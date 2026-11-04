import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { TrackerSetupReview, TrackerSetupNotice } from "./TrackerSetupReview";

vi.mock("@/serverFunctions/ai-visibility", () => ({}));

const props = {
  review: {
    patch: { prompts: [{ text: "Welche Sportnahrung?" }] },
    estimate: null,
  },
  enabled: false,
  creating: true,
  pending: false,
  error: null,
  canSchedule: true,
  scheduling: false,
  onBack: vi.fn(),
  onSave: vi.fn(),
  onSaveAndSchedule: vi.fn(),
};

describe("manual prompt review", () => {
  it.each([true, false])(
    "offers only saving for creating=%s, even when scheduling is available",
    (creating) => {
      const html = renderToStaticMarkup(
        createElement(TrackerSetupReview, {
          ...props,
          creating,
          startPaused: true,
        }),
      );
      expect(html).toContain("Save prompts without tracking");
      expect(html).toContain(
        "No automatic collection, baseline, or scheduled check will start",
      );
      expect(html).not.toContain("Save and track weekly");
      expect(html).not.toContain("Run now");
      expect(html).not.toContain("estimated");
      expect(html).toContain("Welche Sportnahrung?");
    },
  );
  it("does not claim an existing enabled schedule was paused", () => {
    const html = renderToStaticMarkup(
      createElement(TrackerSetupReview, {
        ...props,
        startPaused: true,
        enabled: true,
        creating: false,
      }),
    );
    expect(html).toContain("existing schedule remains active");
  });
  it("keeps the normal weekly setup action", () => {
    const html = renderToStaticMarkup(createElement(TrackerSetupReview, props));
    expect(html).toContain("Save and track weekly");
  });
  it("disables saving while the request is pending", () => {
    const html = renderToStaticMarkup(
      createElement(TrackerSetupReview, {
        ...props,
        startPaused: true,
        pending: true,
      }),
    );
    expect(html.match(/ disabled=""/g)).toHaveLength(2);
  });
});

it.each([true, false])(
  "shows neutral guidance in manual mode with provider=%s",
  (providerConfigured) => {
    const html = renderToStaticMarkup(
      createElement(TrackerSetupNotice, { manual: true, providerConfigured }),
    );
    expect(html).toContain(
      "Prompts werden über OpenRouter generiert und ohne automatisches Tracking gespeichert.",
    );
    expect(html).not.toContain("DataForSEO");
  },
);
it("retains the provider warning for collection and hides it when configured", () => {
  expect(
    renderToStaticMarkup(
      createElement(TrackerSetupNotice, {
        manual: false,
        providerConfigured: false,
      }),
    ),
  ).toContain("DataForSEO");
  expect(
    renderToStaticMarkup(
      createElement(TrackerSetupNotice, {
        manual: false,
        providerConfigured: true,
      }),
    ),
  ).toBe("");
});
