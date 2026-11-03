/**
 * Browser-side Sentry noise: errors raised by software we do not ship.
 *
 * ⚠️ GENERATED. The canonical copy is
 * `ProductFactory/_services/sentry-client-noise/sentry-client-noise.ts`; edit it
 * there and re-run `node _services/sentry-client-noise/install.mjs --write <product>`
 * rather than editing this file in a product. One list across every product is
 * the point: the same wallet extension or in-app browser trips every site, and
 * a per-product copy is how one product learns about it five issues later.
 *
 * Wire-up, in the product's `instrumentation-client.ts`:
 *
 *   Sentry.init({
 *     ...,
 *     ignoreErrors: CLIENT_NOISE_IGNORE_ERRORS,
 *     denyUrls: CLIENT_NOISE_DENY_URLS,
 *   });
 *
 * and in `beforeSend` (shared by browser, server and edge, so it must not
 * assume a `window`): `beforeSend: dropClientNoise(scrubEvent)`.
 *
 * Every rule below is narrow by shape, never "anything from Chrome" or
 * "anything with no stack": a real failure of the same kind must still report.
 */

/**
 * Messages that only ever come from injected code.
 *
 * - "Failed to connect to MetaMask" / "MetaMask extension not found": a wallet
 *   extension's inpage script restoring its session on every page it can
 *   reach. None of our sites talk to a wallet.
 * - "Java object is gone": the Facebook / Instagram in-app browser's Android
 *   bridge posting to a webview that has already been torn down.
 * - "Object Not Found Matching Id:N, MethodName:update, ParamCount:N": a
 *   native bridge injected into some WebViews and in-app browsers, rejecting
 *   a call it made to itself. It has no frame of ours.
 */
export const CLIENT_NOISE_IGNORE_ERRORS: RegExp[] = [
  /Failed to connect to MetaMask/,
  /MetaMask extension not found/,
  /Java object is gone/,
  /Object Not Found Matching Id:\d+, MethodName:\w+, ParamCount:\d+/,
];

/** Script origins that are never ours: browser extensions and in-app webview injections. */
export const CLIENT_NOISE_DENY_URLS: RegExp[] = [
  /^chrome-extension:\/\//i,
  /^moz-extension:\/\//i,
  /^safari-(web-)?extension:\/\//i,
  /\/scripts\/inpage\.js/,
  /navigation_performance_logger_android/,
];

type Frame = { filename?: unknown };
type ExceptionValue = {
  type?: unknown;
  value?: unknown;
  mechanism?: { type?: unknown };
  stacktrace?: { frames?: Frame[] } | null;
};
export type NoiseCandidate = {
  message?: unknown;
  exception?: { values?: ExceptionValue[] };
};

/** The page's own state, injectable so the rules can be tested without a DOM. */
export type PageState = { translated: boolean };

const BARE_UNDEFINED_REJECTION = /^Non-Error promise rejection captured with value: undefined$/;
const DOM_TREE_CONFLICT = /Failed to execute '(?:removeChild|insertBefore)' on 'Node'/;

/**
 * Has the browser's page translator rewritten this document?
 *
 * Chrome's translator adds `translated-ltr` / `translated-rtl` to <html> and
 * replaces each text node with `<font style="vertical-align: inherit">`. The
 * second check catches the in-page widget, which leaves the fonts but not
 * always the class. Always false outside a browser.
 */
export function pageIsTranslated(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const html = document.documentElement;
    if (html.classList.contains("translated-ltr") || html.classList.contains("translated-rtl")) return true;
    return document.querySelector('font[style*="vertical-align"]') !== null;
  } catch {
    return false;
  }
}

/**
 * React removing or inserting a node the translator has already swapped out.
 *
 * React keeps a reference to the text node it rendered; the translator replaces
 * it with a `<font>`, so React's later `removeChild` finds the node is no
 * longer a child of its parent and throws. It is only a translation conflict
 * when the page really is translated, so a bare `removeChild` error on an
 * untranslated page still counts as ours.
 */
export function isTranslationDomConflict(
  error: { message?: unknown } | null | undefined,
  page: PageState = { translated: pageIsTranslated() },
): boolean {
  return page.translated && typeof error?.message === "string" && DOM_TREE_CONFLICT.test(error.message);
}

function values(event: NoiseCandidate): ExceptionValue[] {
  return event.exception?.values ?? [];
}

function messages(event: NoiseCandidate): string[] {
  const out: string[] = [];
  if (typeof event.message === "string") out.push(event.message);
  for (const v of values(event)) if (typeof v.value === "string") out.push(v.value);
  return out;
}

/**
 * A promise rejected with `undefined`, from the global handler, with no stack.
 *
 * Sentry can only say "a promise was rejected with nothing". With no value and
 * no frame there is nothing to find or fix, and none of our code rejects with
 * no reason. A rejection that carries any frame still reports.
 */
function isBareUndefinedRejection(event: NoiseCandidate): boolean {
  return values(event).some(
    (v) =>
      typeof v.value === "string" &&
      BARE_UNDEFINED_REJECTION.test(v.value) &&
      v.mechanism?.type === "auto.browser.global_handlers.onunhandledrejection" &&
      !(v.stacktrace?.frames?.length ?? 0),
  );
}

/** True when the event comes from injected software or the visitor's translator, not our code. */
export function isClientNoiseEvent(event: NoiseCandidate, page: PageState = { translated: pageIsTranslated() }): boolean {
  const all = messages(event);
  if (all.some((m) => CLIENT_NOISE_IGNORE_ERRORS.some((p) => p.test(m)))) return true;
  if (isBareUndefinedRejection(event)) return true;
  return all.some((m) => isTranslationDomConflict({ message: m }, page));
}

/** Wraps a `beforeSend` so client noise is dropped before anything else sees it. */
export function dropClientNoise<E extends NoiseCandidate, A extends unknown[], R>(
  next: (event: E, ...rest: A) => R,
): (event: E, ...rest: A) => R | null {
  return (event, ...rest) => (isClientNoiseEvent(event) ? null : next(event, ...rest));
}
