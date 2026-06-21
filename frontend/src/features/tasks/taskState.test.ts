import { describe, expect, it } from "vitest";
import {
  STATUS_META,
  canPromote,
  getRowActions,
  isDestructiveTransition,
  nextPromotionStatus,
} from "./taskState";
import type { TaskStatus } from "./types";

describe("nextPromotionStatus", () => {
  it("advances open -> in_progress on one click", () => {
    expect(nextPromotionStatus("open")).toBe("in_progress");
  });

  it("advances in_progress -> done on one click", () => {
    expect(nextPromotionStatus("in_progress")).toBe("done");
  });

  it("does not one-click-promote terminal/branch states", () => {
    expect(nextPromotionStatus("done")).toBeNull();
    expect(nextPromotionStatus("blocked")).toBeNull();
    expect(nextPromotionStatus("archived")).toBeNull();
  });

  it("canPromote mirrors nextPromotionStatus", () => {
    expect(canPromote("open")).toBe(true);
    expect(canPromote("in_progress")).toBe(true);
    expect(canPromote("done")).toBe(false);
    expect(canPromote("blocked")).toBe(false);
    expect(canPromote("archived")).toBe(false);
  });
});

describe("getRowActions (the ⋯ menu graph)", () => {
  const ids = (status: TaskStatus) => getRowActions(status).map((a) => a.id);

  it("open / in_progress can block, archive, delete (reverse moves are menu-only)", () => {
    expect(ids("open")).toEqual(["edit", "block", "archive", "delete"]);
    expect(ids("in_progress")).toEqual(["edit", "block", "archive", "delete"]);
  });

  it("blocked can be unblocked", () => {
    expect(ids("blocked")).toEqual(["edit", "unblock", "archive", "delete"]);
  });

  it("done offers reopen (destructive) + archive, never one-click", () => {
    expect(ids("done")).toEqual(["edit", "reopen", "archive", "delete"]);
  });

  it("archived can only be restored or deleted", () => {
    expect(ids("archived")).toEqual(["edit", "restore", "delete"]);
  });

  it("delete and reopen are flagged destructive everywhere they appear", () => {
    for (const status of ["open", "in_progress", "blocked", "done", "archived"] as TaskStatus[]) {
      for (const action of getRowActions(status)) {
        if (action.id === "delete" || action.id === "reopen") {
          expect(action.destructive).toBe(true);
        }
      }
    }
  });

  it("transition actions carry the correct target status", () => {
    const byId = (status: TaskStatus, id: string) =>
      getRowActions(status).find((a) => a.id === id);
    expect(byId("open", "block")?.toStatus).toBe("blocked");
    expect(byId("blocked", "unblock")?.toStatus).toBe("open");
    expect(byId("done", "reopen")?.toStatus).toBe("open");
    expect(byId("open", "archive")?.toStatus).toBe("archived");
    expect(byId("archived", "restore")?.toStatus).toBe("open");
    expect(byId("open", "edit")?.toStatus).toBeUndefined();
    expect(byId("open", "delete")?.toStatus).toBeUndefined();
  });
});

describe("isDestructiveTransition (clears completed_at)", () => {
  it("returns true when leaving a completed task to an active state", () => {
    expect(isDestructiveTransition("done", "open", true)).toBe(true);
    expect(isDestructiveTransition("done", "in_progress", true)).toBe(true);
    expect(isDestructiveTransition("archived", "open", true)).toBe(true);
  });

  it("returns false when there is no completion to discard", () => {
    expect(isDestructiveTransition("open", "in_progress", false)).toBe(false);
    expect(isDestructiveTransition("in_progress", "done", false)).toBe(false);
  });

  it("returns false when completion is preserved (archive/block)", () => {
    expect(isDestructiveTransition("done", "archived", true)).toBe(false);
    expect(isDestructiveTransition("done", "blocked", true)).toBe(false);
  });
});

describe("STATUS_META", () => {
  it("has a label and glyph for every status", () => {
    for (const status of ["open", "in_progress", "blocked", "done", "archived"] as TaskStatus[]) {
      expect(STATUS_META[status].label.length).toBeGreaterThan(0);
      expect(STATUS_META[status].glyph.length).toBeGreaterThan(0);
    }
  });
});
