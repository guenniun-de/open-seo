import { beforeEach, expect, it, vi } from "vitest";
import { generateAiPrompts } from "./aiPromptSuggestions";

const mocks = vi.hoisted(() => ({
  generate: vi.fn<(options: { prompt: string }) => Promise<unknown>>(),
  access: vi.fn(),
  model: vi.fn(),
}));
vi.mock("ai", () => ({
  generateText: mocks.generate,
  Output: { object: vi.fn() },
}));
vi.mock("../repositories/AiVisibilityRepository", () => ({
  AiVisibilityRepository: { getConfiguration: async () => null },
}));
vi.mock("@/server/features/projects/repositories/ProjectRepository", () => ({
  ProjectRepository: {
    getProjectForOrganization: async () => ({
      name: "Sport",
      domain: "sport.example",
    }),
  },
}));
vi.mock(
  "@/server/features/project-context/repositories/ProjectContextRepository",
  () => ({
    ProjectContextRepository: {
      listSections: async () => [],
      listCompetitors: async () => [],
    },
  }),
);
vi.mock("@/server/lib/runtime-env", () => ({
  isHostedServerAuthMode: async () => false,
  getOptionalEnvValue: async (name: string) =>
    name === "OPENROUTER_MODEL" ? "openrouter/free" : undefined,
}));
vi.mock("@/server/lib/openrouter", () => ({
  requireOpenRouterAccess: mocks.access,
  buildChatAgentModel: mocks.model,
}));
vi.mock("@/server/lib/chatAgent", () => ({
  requireOpenRouterCostUsd: vi.fn(),
}));
vi.mock("@/server/billing/subscription", () => ({
  checkUsageCreditsDepleted: vi.fn(),
}));
vi.mock("@/server/billing/researchSpend", () => ({
  billResearchSpend: vi.fn(),
}));
const input = {
  projectId: "project",
  locationCode: 2276,
  languageCode: "de",
  excludePrompts: [],
};
const customer = {
  organizationId: "organization",
  userId: "user",
  userEmail: "admin@example.com",
};
beforeEach(() => {
  mocks.access.mockResolvedValue({ apiKey: "test-only" });
  mocks.generate.mockResolvedValue({
    output: {
      name: "Sportnahrung",
      prompts: [
        "Welche Sportnahrung passt zu mir?",
        "Welche Produkte helfen beim Training?",
        "Wie wähle ich ein Proteinpulver?",
        "Was hilft beim Muskelaufbau?",
        "Welche Nahrung eignet sich für Ausdauersport?",
      ],
    },
  });
});
it("generates editable German drafts through OpenRouter without DataForSEO or collection", async () => {
  const network = vi.spyOn(globalThis, "fetch");
  const result = await generateAiPrompts(input, customer);
  expect(result.prompts).toContain("Welche Sportnahrung passt zu mir?");
  expect(mocks.model).toHaveBeenCalledWith(
    { apiKey: "test-only" },
    "openrouter/free",
    "low",
  );
  expect(mocks.generate.mock.calls[0][0].prompt).toContain(
    '"languageCode":"de"',
  );
  expect(network).not.toHaveBeenCalled();
});
it("reports provider failures instead of saving partial drafts", async () => {
  mocks.generate.mockRejectedValue(new Error("OpenRouter unavailable"));
  await expect(generateAiPrompts(input, customer)).rejects.toThrow(
    "OpenRouter unavailable",
  );
});
it("reports a missing OpenRouter configuration", async () => {
  mocks.access.mockRejectedValue(new Error("Configure OpenRouter"));
  await expect(generateAiPrompts(input, customer)).rejects.toThrow(
    "Configure OpenRouter",
  );
  expect(mocks.generate).not.toHaveBeenCalled();
});
