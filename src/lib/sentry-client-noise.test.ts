/**
 * Contract tests for the shared browser-noise rules.
 *
 * ⚠️ GENERATED from `ProductFactory/_services/sentry-client-noise/sentry-client-noise.test.ts`.
 * Edit it there and re-run `node _services/sentry-client-noise/install.mjs --write <product>`.
 *
 * Each case pairs a real Sentry event shape with its look-alike that must
 * still report, because a filter that is too wide hides the next real bug.
 */
import { describe, it, expect } from "vitest";
import {
  CLIENT_NOISE_DENY_URLS,
  dropClientNoise,
  isClientNoiseEvent,
  isTranslationDomConflict,
} from "./sentry-client-noise";

const UNTRANSLATED = { translated: false };
const TRANSLATED = { translated: true };

const rejection = (value: string, frames: { filename: string }[] | null = null) => ({
  exception: {
    values: [
      {
        type: "UnhandledRejection",
        value,
        mechanism: { type: "auto.browser.global_handlers.onunhandledrejection" },
        stacktrace: frames ? { frames } : null,
      },
    ],
  },
});

describe("injected-software messages", () => {
  it("drops the wallet extension's session restore (RENEWBIRD_WEB-6)", () => {
    const event = {
      exception: {
        values: [
          { type: "Error", value: "MetaMask extension not found" },
          { type: "i", value: "Failed to connect to MetaMask" },
        ],
      },
    };
    expect(isClientNoiseEvent(event, UNTRANSLATED)).toBe(true);
  });

  it("drops the in-app webview bridge rejection (PERDIEMWISE_WEB-5)", () => {
    const value = "Non-Error promise rejection captured with value: Object Not Found Matching Id:2, MethodName:update, ParamCount:4";
    expect(isClientNoiseEvent(rejection(value), UNTRANSLATED)).toBe(true);
  });

  it("drops the Facebook in-app browser bridge", () => {
    expect(isClientNoiseEvent({ message: "Error invoking postMessage: Java object is gone" }, UNTRANSLATED)).toBe(true);
  });

  it("keeps an ordinary error whose text only resembles them", () => {
    expect(isClientNoiseEvent({ message: "Object not found" }, UNTRANSLATED)).toBe(false);
    expect(isClientNoiseEvent({ message: "Failed to connect to the database" }, UNTRANSLATED)).toBe(false);
  });
});

describe("rejection with no reason", () => {
  const bare = "Non-Error promise rejection captured with value: undefined";

  it("drops a stackless global rejection with value undefined (BRANDMITY_WEB-6)", () => {
    expect(isClientNoiseEvent(rejection(bare), UNTRANSLATED)).toBe(true);
  });

  it("keeps one that carries a frame, because that is findable", () => {
    expect(isClientNoiseEvent(rejection(bare, [{ filename: "app:///_next/static/chunks/app.js" }]), UNTRANSLATED)).toBe(false);
  });

  it("keeps a handled capture of the same text, which our own code made", () => {
    const event = { exception: { values: [{ value: bare, mechanism: { type: "generic" }, stacktrace: null }] } };
    expect(isClientNoiseEvent(event, UNTRANSLATED)).toBe(false);
  });

  it("keeps a rejection with a real value", () => {
    expect(isClientNoiseEvent(rejection("Non-Error promise rejection captured with value: 'quota'"), UNTRANSLATED)).toBe(false);
  });
});

describe("page translation", () => {
  const removeChild = {
    exception: {
      values: [
        {
          type: "NotFoundError",
          value: "Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.",
        },
      ],
    },
  };

  it("drops React's removeChild failure once the page was translated (NEVERPROMPTED_WEB-3)", () => {
    expect(isClientNoiseEvent(removeChild, TRANSLATED)).toBe(true);
    expect(isTranslationDomConflict({ message: removeChild.exception.values[0].value }, TRANSLATED)).toBe(true);
  });

  it("still reports the same error on an untranslated page", () => {
    expect(isClientNoiseEvent(removeChild, UNTRANSLATED)).toBe(false);
    expect(isTranslationDomConflict({ message: removeChild.exception.values[0].value }, UNTRANSLATED)).toBe(false);
  });

  it("does not hide unrelated errors on a translated page", () => {
    expect(isClientNoiseEvent({ message: "TypeError: x is undefined" }, TRANSLATED)).toBe(false);
    expect(isTranslationDomConflict(null, TRANSLATED)).toBe(false);
  });
});

describe("script origins", () => {
  it("denies extension and injected-script URLs only", () => {
    const denied = (u: string) => CLIENT_NOISE_DENY_URLS.some((p) => p.test(u));
    expect(denied("chrome-extension://abc/content.js")).toBe(true);
    expect(denied("app:///scripts/inpage.js")).toBe(true);
    expect(denied("https://www.example.com/_next/static/chunks/app.js")).toBe(false);
  });
});

describe("dropClientNoise", () => {
  const seen: unknown[] = [];
  const next = (e: { message?: string }) => (seen.push(e), e);

  it("passes ordinary events through to the wrapped beforeSend", () => {
    const event = { message: "Checkout failed" };
    expect(dropClientNoise(next)(event)).toBe(event);
  });

  it("returns null for noise and never calls the wrapped function", () => {
    seen.length = 0;
    expect(dropClientNoise(next)({ message: "Failed to connect to MetaMask" })).toBeNull();
    expect(seen).toHaveLength(0);
  });
});
