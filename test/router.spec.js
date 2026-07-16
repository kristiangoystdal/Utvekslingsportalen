import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const mockState = vi.hoisted(() => ({ isAuthenticated: false, user: null }));

vi.mock("../src/js/store.js", () => ({
  default: {
    getters: {
      get isAuthenticated() {
        return mockState.isAuthenticated;
      },
      get user() {
        return mockState.user;
      },
    },
  },
  authReadyPromise: Promise.resolve(),
}));

describe("router navigation guards", () => {
  let router;

  beforeEach(async () => {
    vi.resetModules();
    mockState.isAuthenticated = false;
    mockState.user = null;
    vi.stubEnv("VITE_ADMIN_USER_ID", "admin-uid");

    const mod = await import("../src/js/router.js");
    router = mod.default;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("sends unauthenticated users to Login when visiting a requiresAuth route", async () => {
    await router.push("/profil");
    expect(router.currentRoute.value.name).toBe("Login");
  });

  it("lets authenticated users reach the profile page", async () => {
    mockState.isAuthenticated = true;
    mockState.user = { uid: "user-1" };

    await router.push("/profil");
    expect(router.currentRoute.value.name).toBe("Account");
  });

  it("bounces an already-authenticated user away from the login page", async () => {
    mockState.isAuthenticated = true;
    mockState.user = { uid: "user-1" };

    await router.push("/logg_inn");
    expect(router.currentRoute.value.name).toBe("Account");
  });

  it("keeps non-admin users out of /admin even when logged in", async () => {
    mockState.isAuthenticated = true;
    mockState.user = { uid: "someone-else" };

    await router.push("/admin");
    expect(router.currentRoute.value.name).toBe("Home");
  });

  it("lets the configured admin user into /admin", async () => {
    mockState.isAuthenticated = true;
    mockState.user = { uid: "admin-uid" };

    await router.push("/admin");
    expect(router.currentRoute.value.name).toBe("Admin");
  });

  it("blocks anonymous visitors from /admin", async () => {
    await router.push("/admin");
    expect(router.currentRoute.value.name).toBe("Home");
  });

  it("lets anonymous visitors read the experiences list", async () => {
    await router.push("/erfaringer");
    expect(router.currentRoute.value.name).toBe("Experiences");
  });

  it("lets anonymous visitors read a single experience detail page", async () => {
    await router.push("/erfaringer/some-id");
    expect(router.currentRoute.value.name).toBe("ExperienceDetail");
  });

  it("still requires login to edit an experience", async () => {
    await router.push("/erfaringer/some-id/rediger");
    expect(router.currentRoute.value.name).toBe("Login");
  });

  it("lets any authenticated user (not just admin) edit an experience", async () => {
    mockState.isAuthenticated = true;
    mockState.user = { uid: "someone-else" };

    await router.push("/erfaringer/some-id/rediger");
    expect(router.currentRoute.value.name).toBe("EditExperience");
  });

  it("redirects /min_utveksling to /profil with the exchange tab preselected", async () => {
    mockState.isAuthenticated = true;
    mockState.user = { uid: "user-1" };

    await router.push("/min_utveksling");
    expect(router.currentRoute.value.path).toBe("/profil");
    expect(router.currentRoute.value.query.tab).toBe("exchange");
  });

  it("redirects /erfaringer/ny straight to /profil", async () => {
    mockState.isAuthenticated = true;
    mockState.user = { uid: "user-1" };

    await router.push("/erfaringer/ny");
    expect(router.currentRoute.value.path).toBe("/profil");
  });

  it("falls back to NotFound for unknown paths", async () => {
    await router.push("/this-route-does-not-exist");
    expect(router.currentRoute.value.name).toBe("NotFound");
  });

  it("leaves public routes open to anonymous visitors", async () => {
    await router.push("/utvekslinger");
    expect(router.currentRoute.value.name).toBe("Exchanges");

    await router.push("/kurs");
    expect(router.currentRoute.value.name).toBe("Courses");

    await router.push("/faq");
    expect(router.currentRoute.value.name).toBe("FAQ");
  });
});
