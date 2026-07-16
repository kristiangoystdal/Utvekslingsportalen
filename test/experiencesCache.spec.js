import { describe, it, expect, vi, beforeEach } from "vitest";

const dbState = { get: vi.fn(), push: vi.fn(), set: vi.fn(), update: vi.fn(), remove: vi.fn() };

vi.mock("firebase/database", () => ({
  getDatabase: () => ({}),
  ref: (...args) => ({ path: args.slice(1).join("/") }),
  child: (parent, path) => ({ path }),
  get: (...args) => dbState.get(...args),
  push: (...args) => dbState.push(...args),
  set: (...args) => dbState.set(...args),
  update: (...args) => dbState.update(...args),
  remove: (...args) => dbState.remove(...args),
}));

function snapshot(exists, val) {
  return { exists: () => exists, val: () => val };
}

describe("experiencesCache", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("only returns published experiences from getExperiencesData", async () => {
    const { getExperiencesData } = await import("../src/js/experiencesCache.js");

    dbState.get.mockResolvedValue(
      snapshot(true, {
        a: { status: "published", title: "A" },
        b: { status: "pending", title: "B" },
      })
    );

    const result = await getExperiencesData();

    expect(result).toEqual({ a: { status: "published", title: "A" } });
  });

  it("serves subsequent reads from the sessionStorage cache instead of hitting the db again", async () => {
    const { getExperiencesData } = await import("../src/js/experiencesCache.js");

    dbState.get.mockResolvedValue(snapshot(true, { a: { status: "published", title: "A" } }));

    await getExperiencesData();
    await getExperiencesData();

    expect(dbState.get).toHaveBeenCalledTimes(1);
  });

  it("refetches once the cache TTL has expired", async () => {
    const { getExperiencesData } = await import("../src/js/experiencesCache.js");

    dbState.get.mockResolvedValue(snapshot(true, { a: { status: "published", title: "A" } }));

    const realNow = Date.now;
    let now = realNow();
    vi.spyOn(Date, "now").mockImplementation(() => now);

    await getExperiencesData();
    now += 31 * 60 * 1000; // past the 30 minute TTL
    await getExperiencesData();

    expect(dbState.get).toHaveBeenCalledTimes(2);
    Date.now = realNow;
  });

  it("clears the cache after createExperience so the next read is fresh", async () => {
    const { createExperience } = await import("../src/js/experiencesCache.js");

    sessionStorage.setItem("experiences_cache_v1", JSON.stringify({ stale: true }));
    sessionStorage.setItem("experiences_cache_time_v1", String(Date.now()));

    dbState.push.mockReturnValue({ key: "new-id" });
    dbState.set.mockResolvedValue();

    const id = await createExperience({ title: "New" });

    expect(id).toBe("new-id");
    expect(sessionStorage.getItem("experiences_cache_v1")).toBeNull();
  });

  it("preserves the existing status and createdAt when updating an experience", async () => {
    const { updateExperience } = await import("../src/js/experiencesCache.js");

    dbState.get.mockResolvedValue(
      snapshot(true, { status: "pending", createdAt: 123, title: "Old" })
    );
    dbState.set.mockResolvedValue();

    await updateExperience("id1", { title: "New" });

    expect(dbState.set).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: "pending", createdAt: 123, title: "New" })
    );
  });
});
