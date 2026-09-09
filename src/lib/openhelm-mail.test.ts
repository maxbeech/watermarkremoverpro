// @vitest-environment node
/**
 * Contract tests for this product's OpenHelm Mail client.
 *
 * The `node` environment above is load-bearing, not cosmetic: the client
 * refuses to run where `window` exists, because its API key must never reach a
 * browser. Under a product whose vitest defaults to jsdom, every test here
 * would otherwise hit that guard instead of the behaviour it means to check.
 *
 * ⚠️ GENERATED from `ProductFactory/_services/openhelm-mail/openhelm-mail.test.ts`.
 * Edit it there and re-run `node _services/openhelm-mail/install.mjs --write`.
 *
 * These test the properties a transactional sender must not get wrong: it never
 * reports success it did not get, it never turns a held-for-approval message
 * into "delivered", it never invents a from-address, and it never hides that a
 * recipient was suppressed or that replies will land somewhere unbranded.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { sendEmail, emailEnabled, mailConfig, resetSenderCache } from "./openhelm-mail";

const ORIGINAL_ENV = { ...process.env };

function configure(over: Record<string, string | undefined> = {}) {
  process.env.OPENHELM_API_KEY = "sk_test";
  process.env.OPENHELM_MAIL_INBOX_ID = "inbox-1";
  process.env.OPENHELM_API_URL = "https://worker.test/v1";
  process.env.OPENHELM_PRODUCT_ID = "prod-1";
  for (const [k, v] of Object.entries(over)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

function mockFetch(responses: Array<{ ok: boolean; body: unknown; status?: number }>) {
  const calls: Array<{ url: string; body: Record<string, unknown>; headers: Record<string, string> }> = [];
  let i = 0;
  const fn = vi.fn(async (url: string, init: RequestInit) => {
    const r = responses[Math.min(i++, responses.length - 1)]!;
    calls.push({
      url,
      body: JSON.parse(String(init.body ?? "{}")),
      headers: init.headers as Record<string, string>,
    });
    return {
      ok: r.ok,
      status: r.status ?? (r.ok ? 200 : 400),
      json: async () => r.body,
      text: async () => JSON.stringify(r.body),
    } as unknown as Response;
  });
  vi.stubGlobal("fetch", fn);
  return calls;
}


const OK = { ok: true, body: { message_id: "m1", status: "sent", thread_id: "t1", suppressed: [] } };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  resetSenderCache();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  process.env = { ...ORIGINAL_ENV };
});

describe("configuration", () => {
  it("is disabled — and says so — without a key and an inbox", () => {
    delete process.env.OPENHELM_API_KEY;
    delete process.env.OPENHELM_MAIL_INBOX_ID;
    expect(emailEnabled()).toBe(false);

    configure({ OPENHELM_MAIL_INBOX_ID: undefined });
    expect(emailEnabled()).toBe(false); // a key alone is not enough

    configure();
    expect(emailEnabled()).toBe(true);
  });

  it("defaults to the hosted worker and strips a trailing slash", () => {
    configure({ OPENHELM_API_URL: undefined });
    expect(mailConfig().apiUrl).toBe("https://openhelm-worker.fly.dev/v1");
    configure({ OPENHELM_API_URL: "https://worker.test/v1/" });
    expect(mailConfig().apiUrl).toBe("https://worker.test/v1");
  });
});

describe("sendEmail", () => {
  it("refuses, without calling the API, when unconfigured", async () => {
    delete process.env.OPENHELM_API_KEY;
    const fetchSpy = mockFetch([OK]);
    const result = await sendEmail({ to: "a@b.co", subject: "s", text: "t" });
    expect(result).toEqual({ sent: false, reason: "not_configured" });
    expect(fetchSpy).toHaveLength(0);
  });

  it("posts to the product's own inbox with the bearer key", async () => {
    configure();
    const calls = mockFetch([OK]);
    const result = await sendEmail({ to: "a@b.co", subject: "Hello", markdown: "**hi**" });

    expect(result).toMatchObject({ sent: true, id: "m1", status: "sent", threadId: "t1" });
    expect(calls[0]!.url).toBe("https://worker.test/v1/inboxes/inbox-1/messages");
    expect(calls[0]!.headers.authorization).toBe("Bearer sk_test");
    expect(calls[0]!.body).toMatchObject({ to: ["a@b.co"], subject: "Hello", body_markdown: "**hi**" });
  });

  it("never sends a from-address — the platform decides who this product is", async () => {
    configure();
    const calls = mockFetch([OK]);
    await sendEmail({ to: "a@b.co", subject: "s", text: "t" });
    expect(calls[0]!.body).not.toHaveProperty("from");
    expect(calls[0]!.body).not.toHaveProperty("from_email");
  });

  it("reports a held message as pending_approval, not as delivered", async () => {
    configure();
    mockFetch([{ ok: true, body: { message_id: "m9", status: "pending_approval", thread_id: "t9" } }]);
    const result = await sendEmail({ to: "a@b.co", subject: "s", text: "t" });
    expect(result).toMatchObject({ sent: true, id: "m9", status: "pending_approval", threadId: "t9" });
  });

  it("surfaces the platform's own rejection rather than a generic failure", async () => {
    configure();
    mockFetch([{ ok: false, status: 400, body: { error: "recipient is suppressed after a hard bounce" } }]);
    const result = await sendEmail({ to: "a@b.co", subject: "s", text: "t" });
    expect(result).toEqual({
      sent: false,
      reason: "error",
      error: "recipient is suppressed after a hard bounce",
    });
  });

  it("reports a network failure as an error, never as a send", async () => {
    configure();
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("ECONNREFUSED"); }));
    const result = await sendEmail({ to: "a@b.co", subject: "s", text: "t" });
    expect(result.sent).toBe(false);
    expect(result.sent === false && result.error).toContain("ECONNREFUSED");
  });

  it("rejects a body-less or recipient-less send before hitting the network", async () => {
    configure();
    const calls = mockFetch([OK]);
    expect(await sendEmail({ to: "a@b.co", subject: "s" })).toMatchObject({ sent: false, reason: "error" });
    expect(await sendEmail({ to: [], subject: "s", text: "t" })).toMatchObject({ sent: false, reason: "error" });
    expect(calls).toHaveLength(0);
  });

  it("passes an idempotency key through unchanged", async () => {
    configure();
    const calls = mockFetch([OK]);
    await sendEmail({ to: ["a@b.co", "c@d.co"], subject: "s", text: "t", clientId: "welcome-42" });
    // ONE message, so ONE key. The old client suffixed it per recipient because
    // it had to loop; that is no longer true and a suffixed key would now fail
    // to deduplicate a genuine retry.
    expect(calls[0]!.body.client_id).toBe("welcome-42");
  });
});

describe("recipients", () => {
  it("sends several recipients as ONE message", async () => {
    configure();
    const calls = mockFetch([OK]);
    const result = await sendEmail({ to: ["a@b.co", "c@d.co"], subject: "s", text: "t" });

    expect(calls).toHaveLength(1);
    expect(calls[0]!.body.to).toEqual(["a@b.co", "c@d.co"]);
    expect(result.sent).toBe(true);
  });

  it("carries cc and bcc through", async () => {
    configure();
    const calls = mockFetch([OK]);
    await sendEmail({ to: "a@b.co", cc: ["c@d.co"], bcc: ["hidden@e.co"], subject: "s", text: "t" });
    expect(calls[0]!.body).toMatchObject({ cc: ["c@d.co"], bcc: ["hidden@e.co"] });
  });

  it("reports suppressed recipients even on a successful send", async () => {
    // The message went out; someone on it did not get it. Silence here would be
    // the caller believing everyone was reached.
    configure();
    mockFetch([{ ok: true, body: { message_id: "m1", status: "sent", thread_id: "t1", suppressed: ["bad@x.co"] } }]);
    const result = await sendEmail({ to: ["a@b.co", "bad@x.co"], subject: "s", text: "t" });
    expect(result.sent === true && result.suppressed).toEqual(["bad@x.co"]);
  });

  it("defaults suppressed to an empty list when the platform says nothing", async () => {
    configure();
    mockFetch([{ ok: true, body: { message_id: "m1", status: "sent", thread_id: "t1" } }]);
    const result = await sendEmail({ to: "a@b.co", subject: "s", text: "t" });
    expect(result.sent === true && result.suppressed).toEqual([]);
  });
});

describe("named senders", () => {
  const SENDERS = {
    ok: true,
    body: { senders: [{ id: "inbox-noreply", local_part: "noreply" }, { id: "inbox-support", local_part: "support" }] },
  };

  it("sends from a named sender's inbox", async () => {
    configure();
    const calls = mockFetch([SENDERS, OK]);
    await sendEmail({ to: "a@b.co", subject: "s", text: "t", from: "noreply" });

    expect(calls[0]!.url).toBe("https://worker.test/v1/inboxes/product/senders/list");
    expect(calls[1]!.url).toBe("https://worker.test/v1/inboxes/inbox-noreply/messages");
  });

  it("resolves the sender list once, then reuses it", async () => {
    configure();
    const calls = mockFetch([SENDERS, OK, OK]);
    await sendEmail({ to: "a@b.co", subject: "s", text: "t", from: "noreply" });
    await sendEmail({ to: "a@b.co", subject: "s", text: "t", from: "support" });
    expect(calls.filter((c) => c.url.endsWith("/senders/list"))).toHaveLength(1);
  });

  it("fails loudly on an unknown sender instead of falling back to the primary", async () => {
    // Mail arriving from the wrong address is worse than mail that visibly
    // failed to send.
    configure();
    const calls = mockFetch([SENDERS]);
    const result = await sendEmail({ to: "a@b.co", subject: "s", text: "t", from: "billing" });
    expect(result).toMatchObject({ sent: false, reason: "error" });
    expect(result.sent === false && result.error).toContain('no sender "billing"');
    expect(calls.filter((c) => c.url.endsWith("/messages"))).toHaveLength(0);
  });

  it("says what is missing when OPENHELM_PRODUCT_ID is unset", async () => {
    configure({ OPENHELM_PRODUCT_ID: undefined });
    const calls = mockFetch([SENDERS, OK]);
    const result = await sendEmail({ to: "a@b.co", subject: "s", text: "t", from: "noreply" });
    expect(result.sent === false && result.error).toContain("OPENHELM_PRODUCT_ID");
    expect(calls).toHaveLength(0);
  });

  it("uses the primary inbox when no sender is named", async () => {
    configure();
    const calls = mockFetch([OK]);
    await sendEmail({ to: "a@b.co", subject: "s", text: "t" });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toContain("/inboxes/inbox-1/messages");
  });
});

describe("reply-to honesty", () => {
  it("surfaces where replies will actually land", async () => {
    configure();
    mockFetch([{
      ok: true,
      body: {
        message_id: "m1", status: "sent", thread_id: "t1",
        reply_to: { address: "feedlark+tok@relay.openhelm.ai", reason: "relay_fallback", detail: "no MX yet" },
      },
    }]);
    const result = await sendEmail({ to: "a@b.co", subject: "s", text: "t" });
    // A product whose own domain cannot yet receive replies needs to know that,
    // not discover it when a customer's reply bounces.
    expect(result.sent === true && result.replyTo).toMatchObject({ reason: "relay_fallback" });
  });

  it("is null rather than invented when the platform did not say", async () => {
    configure();
    mockFetch([OK]);
    const result = await sendEmail({ to: "a@b.co", subject: "s", text: "t" });
    expect(result.sent === true && result.replyTo).toBeNull();
  });
});
