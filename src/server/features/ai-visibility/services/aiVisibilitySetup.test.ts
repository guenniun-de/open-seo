import { beforeEach, describe, expect, it, vi } from "vitest";
import { AiVisibilityRepository as repo } from "../repositories/AiVisibilityRepository";
import { saveTracker } from "./aiVisibilitySetup";
import { runScheduledAiVisibility } from "./scheduledAiVisibility";
import { setSchedule } from "./aiVisibilitySchedule";

const { testDb, workflow, provider } = await vi.hoisted(async () => {
  const { createAiVisibilityTestDb } = await import("../aiVisibilityTestDb");
  return {
    testDb: await createAiVisibilityTestDb(),
    workflow: { create: vi.fn() },
    provider: vi.fn(),
  };
});
vi.mock("cloudflare:workers", () => ({
  env: { DATABASE_PROVIDER: "d1", AI_VISIBILITY_WORKFLOW: workflow },
}));
vi.mock("@/db", () => ({ db: testDb.db }));
vi.mock("@/db/runBatch", () => ({ runBatch: testDb.runBatch }));
vi.mock("@/server/lib/provider-access", () => ({
  hasDataforseoAccess: provider,
}));
vi.mock("@/server/lib/runtime-env", () => ({
  isHostedServerAuthMode: async () => false,
  getOptionalEnvValue: async () => undefined,
}));
vi.mock("./aiVisibilityRetention", () => ({ pruneAiVisibility: vi.fn() }));

const input = {
  projectId: "project",
  prompts: [
    {
      text: "Welche Sportnahrung passt zu meinem Trainingsziel?",
      topic: "Sport",
    },
  ],
};
beforeEach(async () => {
  await testDb.seedProject();
  provider.mockResolvedValue(false);
});

describe("manual prompt persistence without DataForSEO", () => {
  it("saves a disabled tracker, survives reload and cannot be picked up by scheduling", async () => {
    const network = vi.spyOn(globalThis, "fetch");
    const saved = await saveTracker({ ...input, startPaused: true });
    expect(saved.state).toMatchObject({
      providerConfigured: false,
      configured: true,
      tracker: { enabled: false, nextCheckAt: null },
      prompts: [{ text: input.prompts[0].text }],
    });
    await runScheduledAiVisibility();
    expect(await repo.listDue("2099-01-01T00:00:00.000Z")).toEqual([]);
    expect(await repo.listRuns(input.projectId)).toEqual([]);
    expect(workflow.create).not.toHaveBeenCalled();
    expect(network).not.toHaveBeenCalled();
    expect(
      (await repo.getConfiguration(input.projectId))?.tracker,
    ).toMatchObject({ enabled: false, nextCheckAt: null });
  });

  it("edits saved prompts without changing the paused schedule", async () => {
    const saved = await saveTracker({ ...input, startPaused: true });
    await saveTracker({
      projectId: input.projectId,
      prompts: [
        {
          id: saved.state.prompts[0].id,
          text: "Welche Produkte helfen beim Muskelaufbau?",
          topic: "Training",
        },
      ],
    });
    const config = await repo.getConfiguration(input.projectId);
    expect(config?.tracker).toMatchObject({
      enabled: false,
      nextCheckAt: null,
    });
    expect(config?.prompts.filter((p) => !p.archived)).toMatchObject([
      { text: "Welche Produkte helfen beim Muskelaufbau?", topic: "Training" },
    ]);
    expect(await repo.listRuns(input.projectId)).toEqual([]);
  });

  it("preserves existing enabled trackers and the normal weekly default", async () => {
    const saved = await saveTracker(input);
    expect(saved.state.tracker?.enabled).toBe(true);
    expect(saved.state.tracker?.nextCheckAt).toBeTruthy();
    const before = await repo.getConfiguration(input.projectId);
    await saveTracker({ ...input, startPaused: true });
    expect((await repo.getConfiguration(input.projectId))?.tracker).toEqual(
      before?.tracker,
    );
    expect(workflow.create).not.toHaveBeenCalled();
  });

  it("refuses collection without the provider, leaving saved prompts paused", async () => {
    await saveTracker({ ...input, startPaused: true });
    await expect(
      setSchedule(
        { projectId: input.projectId, enabled: true },
        {
          organizationId: "organization",
          userId: "user",
          userEmail: "admin@example.com",
        },
      ),
    ).rejects.toMatchObject({ reason: "PROVIDER_NOT_CONFIGURED" });
    expect((await repo.getTracker(input.projectId))?.enabled).toBe(false);
    expect(workflow.create).not.toHaveBeenCalled();
  });

  it("does not create configuration when project validation fails", async () => {
    await expect(
      saveTracker({ ...input, projectId: "missing", startPaused: true }),
    ).rejects.toMatchObject({ reason: "PROJECT_NOT_FOUND" });
    expect(await repo.getConfiguration("missing")).toBeNull();
    expect(workflow.create).not.toHaveBeenCalled();
  });
});

it("preserves a custom paused schedule and engines when manually adding prompts", async () => {
  const saved = await saveTracker({
    ...input,
    engines: ["gemini"],
    languageCode: "de",
    locationCode: 2276,
  });
  if (!saved.state.tracker) throw new Error("Tracker was not saved");
  await repo.updateTracker(saved.state.tracker.id, {
    enabled: false,
    scheduleInterval: "monthly",
    nextCheckAt: "2026-12-31T06:00:00.000Z",
    lastSkipReason: "previous notice",
  });
  const before = await repo.getConfiguration(input.projectId);
  await saveTracker({
    projectId: input.projectId,
    startPaused: true,
    prompts: [{ text: "Welche Produkte sind vegan?", topic: "Ernährung" }],
  });
  const after = await repo.getConfiguration(input.projectId);
  expect(after?.tracker).toEqual(before?.tracker);
  expect(after?.prompts.filter((p) => !p.archived)).toHaveLength(2);
  expect(await repo.listRuns(input.projectId)).toEqual([]);
  expect(workflow.create).not.toHaveBeenCalled();
});
