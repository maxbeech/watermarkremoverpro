/**
 * Browser-side Sentry noise filters. A wallet or other extension injecting its
 * own script into the page never runs our code, so there is nothing here to
 * fix (NEVERPROMPTED_WEB-2: "Failed to connect to MetaMask" from
 * `scripts/inpage.js`).
 */
export const CLIENT_IGNORED_ERROR_PATTERNS: RegExp[] = [/Failed to connect to MetaMask/, /MetaMask extension not found/];

/** Scripts served by an extension or an in-app webview, never by this site. */
export const CLIENT_DENIED_URLS: RegExp[] = [
  /^chrome-extension:\/\//i,
  /^moz-extension:\/\//i,
  /^safari-(web-)?extension:\/\//i,
  /\/scripts\/inpage\.js$/i,
];
