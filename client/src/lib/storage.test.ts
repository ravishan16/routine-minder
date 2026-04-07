import { beforeEach, describe, expect, it, vi } from "vitest";
import { routinesApi } from "./storage";
import type { Routine } from "./schema";

const ROUTINES_KEY = "rm_routines";

function seedRoutines(routines: Routine[]) {
  localStorage.setItem(ROUTINES_KEY, JSON.stringify(routines));
}

describe("routinesApi.reorder", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ success: true }),
      }))
    );
  });

  it("rewrites local routines in ordered id sequence with sequential sortOrder", async () => {
    seedRoutines([
      { id: "a", name: "A", icon: "🅰️", timeCategories: ["AM"], isActive: true, sortOrder: 0 },
      { id: "b", name: "B", icon: "🅱️", timeCategories: ["PM"], isActive: true, sortOrder: 1 },
      { id: "c", name: "C", icon: "©️", timeCategories: ["ALL"], isActive: true, sortOrder: 2 },
    ]);

    await routinesApi.reorder(["c", "a", "b"]);

    const routines = JSON.parse(localStorage.getItem(ROUTINES_KEY) || "[]") as Routine[];
    expect(routines.map((routine) => routine.id)).toEqual(["c", "a", "b"]);
    expect(routines.map((routine) => routine.sortOrder)).toEqual([0, 1, 2]);
  });

  it("does nothing for a single-routine order", async () => {
    seedRoutines([
      { id: "only", name: "Only", icon: "✅", timeCategories: ["ALL"], isActive: true, sortOrder: 0 },
    ]);
    const fetchMock = vi.mocked(fetch);

    await routinesApi.reorder(["only"]);

    const routines = JSON.parse(localStorage.getItem(ROUTINES_KEY) || "[]") as Routine[];
    expect(routines).toHaveLength(1);
    expect(routines[0].id).toBe("only");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("preserves routine metadata after reorder", async () => {
    seedRoutines([
      {
        id: "r1",
        name: "Hydrate",
        icon: "💧",
        timeCategories: ["AM", "NOON"],
        isActive: true,
        sortOrder: 0,
      },
      {
        id: "r2",
        name: "Walk",
        icon: "🚶",
        timeCategories: ["PM"],
        isActive: true,
        sortOrder: 1,
      },
    ]);

    await routinesApi.reorder(["r2", "r1"]);

    const routines = JSON.parse(localStorage.getItem(ROUTINES_KEY) || "[]") as Routine[];
    expect(routines[0]).toMatchObject({
      id: "r2",
      name: "Walk",
      icon: "🚶",
      timeCategories: ["PM"],
    });
    expect(routines[1]).toMatchObject({
      id: "r1",
      name: "Hydrate",
      icon: "💧",
      timeCategories: ["AM", "NOON"],
    });
  });

  it("fires sync API call with ordered ids", async () => {
    seedRoutines([
      { id: "one", name: "One", icon: "1️⃣", timeCategories: ["ALL"], isActive: true, sortOrder: 0 },
      { id: "two", name: "Two", icon: "2️⃣", timeCategories: ["ALL"], isActive: true, sortOrder: 1 },
    ]);
    const fetchMock = vi.mocked(fetch);

    await routinesApi.reorder(["two", "one"]);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/routines/reorder"),
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ orderedIds: ["two", "one"] }),
      })
    );
  });
});
