import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getConfiguration: vi.fn(),
  saveConfiguration: vi.fn(),
  projectPatch: vi.fn(),
  getTracker: vi.fn(),
}));

vi.mock("../repositories/AiVisibilityRepository", () => ({
  AiVisibilityRepository: {
    getConfiguration: mocks.getConfiguration,
    saveConfiguration: mocks.saveConfiguration,
  },
}));

vi.mock("./aiVisibilityMutation", () => ({
  projectPatch: mocks.projectPatch,
}));

vi.mock("./aiVisibilityState", () => ({
  getTracker: mocks.getTracker,
}));

import { saveTracker } from "./aiVisibilitySetup";

const input = {
  projectId: "test-project",
  prompts: [{ text: "Welche Sportnahrung passt zu meinem Trainingsziel?" }],
};

function configuration() {
  return {
    tracker: {
      enabled: true,
      nextCheckAt: "2026-11-10T08:00:00.000Z",
    },
    prompts: [],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.projectPatch.mockImplementation(async () => ({
    rows: configuration(),
    created: 1,
    updated: 0,
    skipped: 0,
  }));
  mocks.getTracker.mockResolvedValue({ configured: true });
});

describe("saveTracker startPaused", () => {
  it("creates a new tracker without automatic tracking", async () => {
    mocks.getConfiguration.mockResolvedValue(null);

    await saveTracker({ ...input, startPaused: true });

    expect(mocks.saveConfiguration).toHaveBeenCalledWith(
      expect.objectContaining({
        tracker: expect.objectContaining({
          enabled: false,
          nextCheckAt: null,
        }),
      }),
    );
  });

  it("preserves the default schedule without startPaused", async () => {
    mocks.getConfiguration.mockResolvedValue(null);

    await saveTracker(input);

    expect(mocks.saveConfiguration).toHaveBeenCalledWith(
      expect.objectContaining({
        tracker: expect.objectContaining({
          enabled: true,
          nextCheckAt: "2026-11-10T08:00:00.000Z",
        }),
      }),
    );
  });

  it("does not pause an existing tracker", async () => {
    const existing = configuration();
    mocks.getConfiguration.mockResolvedValue(existing);

    await saveTracker({ ...input, startPaused: true });

    expect(mocks.projectPatch).toHaveBeenCalledWith(
      "test-project",
      { prompts: input.prompts },
      existing,
    );
    expect(mocks.saveConfiguration).toHaveBeenCalledWith(
      expect.objectContaining({
        tracker: expect.objectContaining({
          enabled: true,
          nextCheckAt: "2026-11-10T08:00:00.000Z",
        }),
      }),
    );
  });
});
