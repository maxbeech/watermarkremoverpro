/**
 * ⚠️ GENERATED. Canonical copy:
 * `ProductFactory/_services/openhelm-analytics/openhelm-analytics.test.ts`.
 *
 * Covers the Measurement Protocol module: the half a product can exercise
 * without a DOM, and the half that carries the rules GA4 enforces silently
 * (event-name shape, the 25-event cap, the params that decide whether an event
 * appears in reports at all).
 */
import { describe, expect, it, vi } from "vitest";
import {
  MAX_EVENTS_PER_REQUEST,
  isValidEventName,
  newClientId,
  sendEvents,
  trackEvent,
  configFromEnv,
} from "../src/lib/openhelm-analytics-mp";

const CONFIG = {
  measurementId: "G-TEST12345",
  apiSecret: "secret",
  clientId: "123.456",
  surface: "desktop" as const,
};

function okFetch() {
  return vi.fn().mockResolvedValue({ ok: true, status: 204 }) as unknown as typeof fetch;
}

describe("configuration", () => {
  it("refuses to send when nothing is configured, rather than pretending", async () => {
    const res = await sendEvents({}, [{ name: "test_event" }], okFetch());
    expect(res).toEqual({ sent: false, reason: "not_configured" });
  });

  it("treats a missing client id as unconfigured, since an event with no client id has no user", async () => {
    const res = await sendEvents(
      { measurementId: "G-X", apiSecret: "s" },
      [{ name: "test_event" }],
      okFetch(),
    );
    expect(res).toEqual({ sent: false, reason: "not_configured" });
  });

  it("reads both the public web id and a server-only id from the environment", () => {
    expect(configFromEnv({ NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-A" }).measurementId).toBe("G-A");
    expect(configFromEnv({ GA_MEASUREMENT_ID: "G-B" }).measurementId).toBe("G-B");
  });
});

describe("event names", () => {
  it("accepts GA4-legal names", () => {
    expect(isValidEventName("purchase")).toBe(true);
    expect(isValidEventName("a_b_9")).toBe(true);
  });

  it("rejects what GA4 would silently discard", () => {
    expect(isValidEventName("9lives")).toBe(false); // must start with a letter
    expect(isValidEventName("has-dash")).toBe(false);
    expect(isValidEventName("has space")).toBe(false);
    expect(isValidEventName("x".repeat(41))).toBe(false); // 40 char cap
  });

  it("fails the send rather than posting a name that will vanish", async () => {
    const res = await sendEvents(CONFIG, [{ name: "bad-name" }], okFetch());
    expect(res).toEqual({ sent: false, reason: "invalid", error: "invalid event name: bad-name" });
  });
});

describe("sending", () => {
  it("posts to the web-stream endpoint with the measurement id", async () => {
    const f = okFetch();
    const res = await trackEvent(CONFIG, "signup", { plan: "pro" }, f);
    expect(res).toEqual({ sent: true, events: 1 });
    const [url, init] = (f as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain("measurement_id=G-TEST12345");
    expect(url).toContain("api_secret=secret");
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.client_id).toBe("123.456");
    expect(body.events[0].name).toBe("signup");
    expect(body.events[0].params.plan).toBe("pro");
  });

  it("carries the params without which GA4 accepts an event and then hides it", async () => {
    const f = okFetch();
    await trackEvent(CONFIG, "signup", {}, f);
    const body = JSON.parse(
      ((f as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit).body as string,
    );
    expect(body.events[0].params.engagement_time_msec).toBe(1);
    expect(body.events[0].params.session_id).toBeTruthy();
    expect(body.events[0].params.platform).toBe("desktop");
  });

  it("uses the app-stream shape for a mobile app, not the web one", async () => {
    const f = okFetch();
    await trackEvent(
      { firebaseAppId: "1:123:android:abc", apiSecret: "s", clientId: "inst-1", surface: "android" },
      "level_up",
      {},
      f,
    );
    const [url, init] = (f as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain("firebase_app_id=1%3A123%3Aandroid%3Aabc");
    expect(url).not.toContain("measurement_id");
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.app_instance_id).toBe("inst-1");
    expect(body.client_id).toBeUndefined();
  });

  it("refuses more events than GA4 will take in one request", async () => {
    const many = Array.from({ length: MAX_EVENTS_PER_REQUEST + 1 }, (_, i) => ({ name: `e_${i}` }));
    const res = await sendEvents(CONFIG, many, okFetch());
    expect(res.sent).toBe(false);
    expect(res).toMatchObject({ reason: "invalid" });
  });

  it("reports a network failure instead of throwing into the caller's action", async () => {
    const f = vi.fn().mockRejectedValue(new Error("offline")) as unknown as typeof fetch;
    const res = await sendEvents(CONFIG, [{ name: "test_event" }], f);
    expect(res).toEqual({ sent: false, reason: "error", error: "offline" });
  });

  it("reports a non-2xx as an error rather than as a send", async () => {
    const f = vi.fn().mockResolvedValue({ ok: false, status: 403 }) as unknown as typeof fetch;
    const res = await sendEvents(CONFIG, [{ name: "test_event" }], f);
    expect(res).toEqual({ sent: false, reason: "error", error: "HTTP 403" });
  });
});

describe("client id", () => {
  it("mints GA's <random>.<seconds> shape", () => {
    expect(newClientId(() => 1_700_000_000_000)).toMatch(/^\d+\.1700000000$/);
  });
});
