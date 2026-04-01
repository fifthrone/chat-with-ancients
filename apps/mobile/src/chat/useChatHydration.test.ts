import { describe, expect, it } from "vitest";
import { persistedToUIMessages } from "./useChatHydration";

describe("persistedToUIMessages", () => {
  it("preserves system role for model context", () => {
    const ui = persistedToUIMessages([
      {
        id: 1,
        role: "system",
        content: "You are in character.",
        createdAt: "2020-01-01T00:00:00.000Z",
      },
    ]);
    expect(ui).toHaveLength(1);
    expect(ui[0].role).toBe("system");
    expect(ui[0].parts[0]).toMatchObject({
      type: "text",
      text: "You are in character.",
    });
  });

  it("maps user and assistant rows", () => {
    const ui = persistedToUIMessages([
      {
        id: 2,
        role: "user",
        content: "Hi",
        createdAt: "2020-01-01T00:00:01.000Z",
      },
      {
        id: 3,
        role: "assistant",
        content: "Hello.",
        createdAt: "2020-01-01T00:00:02.000Z",
      },
    ]);
    expect(ui.map((m) => m.role)).toEqual(["user", "assistant"]);
  });
});
