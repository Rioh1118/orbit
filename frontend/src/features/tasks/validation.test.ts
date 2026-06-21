import { describe, expect, it } from "vitest";
import { MAX_TASK_TITLE_LENGTH, validateTaskTitle } from "./validation";

describe("validateTaskTitle", () => {
  it("rejects an empty string", () => {
    const r = validateTaskTitle("");
    expect(r.ok).toBe(false);
  });

  it("rejects whitespace-only input", () => {
    const r = validateTaskTitle("   \t  ");
    expect(r.ok).toBe(false);
  });

  it("accepts and trims a valid title", () => {
    const r = validateTaskTitle("  fix login  ");
    expect(r).toEqual({ ok: true, value: "fix login" });
  });

  it("accepts a title exactly at the max length", () => {
    const r = validateTaskTitle("a".repeat(MAX_TASK_TITLE_LENGTH));
    expect(r.ok).toBe(true);
  });

  it("rejects a title over the max length", () => {
    const r = validateTaskTitle("a".repeat(MAX_TASK_TITLE_LENGTH + 1));
    expect(r.ok).toBe(false);
  });
});
