import { describe, expect, it } from "vitest";
import {
  DEFAULT_TASK_FILTER,
  filterTasks,
  parseTaskFilter,
  taskFilterToParams,
  type TaskFilter,
} from "./filters";
import type { Task } from "./types";

function makeTask(over: Partial<Task>): Task {
  return {
    id: crypto.randomUUID(),
    title: "t",
    description: "",
    category: "new_feature",
    status: "open",
    external_ref: "",
    started_at: null,
    completed_at: null,
    created_at: "2026-06-01T00:00:00Z",
    updated_at: "2026-06-01T00:00:00Z",
    ...over,
  };
}

describe("parseTaskFilter (URL -> filter)", () => {
  it("defaults to all/all when params are empty", () => {
    expect(parseTaskFilter(new URLSearchParams())).toEqual(DEFAULT_TASK_FILTER);
  });

  it("reads valid status and category", () => {
    const f = parseTaskFilter(new URLSearchParams("status=open&category=bug_fix"));
    expect(f).toEqual({ status: "open", category: "bug_fix" });
  });

  it("falls back to all for unknown values (a bad URL never breaks the view)", () => {
    const f = parseTaskFilter(new URLSearchParams("status=garbage&category=nope"));
    expect(f).toEqual({ status: "all", category: "all" });
  });

  it("reads archived as an explicit status", () => {
    expect(parseTaskFilter(new URLSearchParams("status=archived")).status).toBe("archived");
  });
});

describe("taskFilterToParams (filter -> URL)", () => {
  it("omits defaults to keep the URL clean", () => {
    expect(taskFilterToParams({ status: "all", category: "all" }).toString()).toBe("");
  });

  it("serializes non-default values", () => {
    expect(taskFilterToParams({ status: "open", category: "all" }).toString()).toBe("status=open");
    expect(taskFilterToParams({ status: "open", category: "bug_fix" }).toString()).toBe(
      "status=open&category=bug_fix",
    );
  });
});

describe("round trip", () => {
  it("parse(serialize(f)) === f", () => {
    const filters: TaskFilter[] = [
      { status: "all", category: "all" },
      { status: "in_progress", category: "all" },
      { status: "all", category: "refactor" },
      { status: "archived", category: "support" },
    ];
    for (const f of filters) {
      expect(parseTaskFilter(taskFilterToParams(f))).toEqual(f);
    }
  });
});

describe("filterTasks", () => {
  const tasks: Task[] = [
    makeTask({ status: "open", category: "bug_fix" }),
    makeTask({ status: "in_progress", category: "new_feature" }),
    makeTask({ status: "done", category: "bug_fix" }),
    makeTask({ status: "archived", category: "bug_fix" }),
  ];

  it("status=all hides archived (archive is an explicit view), so promoting never drops a row", () => {
    const got = filterTasks(tasks, { status: "all", category: "all" });
    expect(got.map((t) => t.status).sort()).toEqual(["done", "in_progress", "open"]);
  });

  it("status=archived shows only archived", () => {
    const got = filterTasks(tasks, { status: "archived", category: "all" });
    expect(got).toHaveLength(1);
    expect(got[0].status).toBe("archived");
  });

  it("status=open shows only open", () => {
    const got = filterTasks(tasks, { status: "open", category: "all" });
    expect(got).toHaveLength(1);
    expect(got[0].status).toBe("open");
  });

  it("category filter narrows within the status set", () => {
    const got = filterTasks(tasks, { status: "all", category: "bug_fix" });
    // open + done bug_fix are kept; archived bug_fix excluded by status=all
    expect(got.map((t) => t.status).sort()).toEqual(["done", "open"]);
  });
});
