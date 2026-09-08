/**
 * Where the workspace lives, written down once.
 *
 * The run id is a query parameter rather than a path segment on purpose: a
 * dynamic segment would make the route render per request on the server for a
 * page whose entire content comes out of the visitor's own browser database,
 * which is a function invocation spent to return the same empty shell every
 * time. As a query parameter the shell stays a static file on the CDN and the
 * id never reaches the origin at all.
 */

export const WORKSPACE_PATH = '/app'

/** The query parameter carrying the run id. */
export const RUN_PARAM = 'run'

export function workspaceUrl(runId?: string): string {
  return runId ? `${WORKSPACE_PATH}?${RUN_PARAM}=${encodeURIComponent(runId)}` : WORKSPACE_PATH
}
