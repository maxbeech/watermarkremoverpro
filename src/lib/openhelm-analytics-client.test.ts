/**
 * ⚠️ GENERATED copy of `_services/openhelm-analytics/openhelm-analytics-client.test.ts`.
 *
 * gtag.js only acts on `arguments` objects in dataLayer. A plain array is
 * silently ignored (verified against real gtag.js: no hit sent), so this pins the
 * shape rather than the contents alone.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const isArguments = (v: unknown) => Object.prototype.toString.call(v) === "[object Arguments]";

describe("dataLayer commands", () => {
  const original = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TEST12345";
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    if (original === undefined) delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    else process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = original;
  });

  it("pushes arguments objects, which is the only shape gtag.js acts on", async () => {
    const win: { dataLayer: unknown[]; location: { href: string } } = { dataLayer: [], location: { href: "https://x.test/" } };
    vi.stubGlobal("window", win);
    vi.stubGlobal("document", { title: "T" });
    const { track, identify, trackPageView } = await import("./openhelm-analytics");

    expect(identify({ userRef: "12b9377cbe7e5c94", plan: "free" })).toBe(true);
    expect(track("sign_up", { method: "email" })).toBe(true);
    expect(trackPageView("/pricing")).toBe(true);

    expect(win.dataLayer).toHaveLength(3);
    for (const entry of win.dataLayer) expect(isArguments(entry)).toBe(true);
    expect(Array.from(win.dataLayer[0] as ArrayLike<unknown>)).toEqual([
      "set", "user_properties", { oh_user_ref: "12b9377cbe7e5c94", oh_plan: "free" },
    ]);
    expect(Array.from(win.dataLayer[1] as ArrayLike<unknown>)).toEqual(["event", "sign_up", { method: "email" }]);
    expect((Array.from(win.dataLayer[2] as ArrayLike<unknown>))[1]).toBe("page_view");
  });
});
