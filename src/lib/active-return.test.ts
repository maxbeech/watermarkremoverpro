import { describe, expect, it } from "vitest";
import { ACTIVE_RETURN_POLICY as p, parseReturnState, reduceActiveReturn } from "./analytics-return";
import { observeActiveReturns } from "./analytics-return-browser";

const start = Date.parse("2026-11-01T12:00:00Z");
const visit = (now = start) => ({ now, kind: "visit" as const, visible: true, trusted: false });
const active = (now: number) => ({ now, kind: "interaction" as const, visible: true, trusted: true });

describe("active return contract", () => {
  it("starts one measured cohort and never counts a timer, reload or passive open tab", () => {
    const first = reduceActiveReturn(null, visit());
    expect(first.events.map(e => e.name)).toEqual([p.firstVisitEvent]);
    expect(reduceActiveReturn(first.state, visit(start + p.minimumGapMs)).events).toEqual([]);
    expect(reduceActiveReturn(first.state, { ...active(start + p.minimumGapMs), trusted: false }).events).toEqual([]);
    expect(reduceActiveReturn(first.state, { ...active(start + p.minimumGapMs), visible: false }).events).toEqual([]);
  });

  it("requires three hours, a distinct idle session and a fresh trusted interaction", () => {
    const first = reduceActiveReturn(null, visit()).state;
    expect(reduceActiveReturn(first, active(start + p.minimumGapMs - 1)).events).toEqual([]);
    const returned = reduceActiveReturn(first, active(start + p.minimumGapMs));
    expect(returned.events).toEqual([{ name: p.returnEvent, params: {
      oh_return_contract: p.version, oh_cohort_date: "2026-11-01",
      oh_return_gap_ms: p.minimumGapMs, oh_return_window_ms: p.observationWindowMs,
    } }]);
    expect(reduceActiveReturn(returned.state, active(start + p.minimumGapMs * 2)).events).toEqual([]);
  });

  it("does not turn a long active session into a return at the three-hour boundary", () => {
    let state = reduceActiveReturn(null, visit()).state;
    for (let now = start + 60000; now <= start + p.minimumGapMs + 60000; now += 60000) {
      const next = reduceActiveReturn(state, active(now));
      expect(next.events, `input now=${now}; expected no return in a continuous session`).toEqual([]);
      state = next.state;
    }
  });

  it("refuses returns outside the fixed observation window and invalid state", () => {
    const first = reduceActiveReturn(null, visit()).state;
    expect(reduceActiveReturn(first, active(start + p.observationWindowMs + 1)).events).toEqual([]);
    expect(() => parseReturnState("invalid", p)).toThrow();
    expect(() => parseReturnState(JSON.stringify({ version: p.version }), p)).toThrow(/firstSeenAt/);
    expect(() => reduceActiveReturn(first, active(start - 1))).toThrow(/backwards/);
    expect(() => reduceActiveReturn(null, visit(), { ...p, minimumGapMs: -1 })).toThrow(/minimumGapMs/);
  });

  it("starts a separate cohort for a changed contract without inventing historical visits", () => {
    const old = reduceActiveReturn(null, visit()).state!;
    const next = reduceActiveReturn(old, visit(start + 1000), { ...p, version: "v2" });
    expect(next.state?.firstSeenAt).toBe(start + 1000);
    expect(next.events.map(e => e.name)).toEqual([p.firstVisitEvent]);
  });
});

describe("browser return observer", () => {
  it("respects consent, reports storage failure and removes every listener", () => {
    const handlers = new Map<string, EventListener>();
    const sent: string[] = []; const errors: Error[] = []; let consent = false;
    const doc = { visibilityState: "visible" as DocumentVisibilityState,
      addEventListener: (name: string, fn: EventListenerOrEventListenerObject) => { handlers.set(name, fn as EventListener); },
      removeEventListener: (name: string) => { handlers.delete(name); } };
    const stop = observeActiveReturns({ document: doc, now: () => start, consented: () => consent,
      storage: { getItem: () => { throw new Error("storage denied"); }, setItem: () => {} },
      send: name => { sent.push(name); return true; }, onError: e => errors.push(e) });
    expect(sent).toEqual([]); expect(errors).toEqual([]);
    consent = true; handlers.get("visibilitychange")!(new Event("visibilitychange"));
    expect(errors[0].message).toBe("storage denied"); expect(sent).toEqual([]);
    stop(); expect(handlers.size).toBe(0);
  });

  it("shares a persisted return across independent browser observers", () => {
    const data = new Map<string, string>(); const events: string[] = [];
    const first = reduceActiveReturn(null, visit()).state;
    data.set(`openhelm:analytics:${p.version}`, JSON.stringify(first));
    const make = () => {
      const handlers = new Map<string, EventListener>();
      observeActiveReturns({ document: { visibilityState: "visible",
        addEventListener: (name, fn) => { handlers.set(name, fn as EventListener); }, removeEventListener: () => {} },
        storage: { getItem: key => data.get(key) ?? null, setItem: (key, value) => { data.set(key, value); } },
        now: () => start + p.minimumGapMs, consented: () => true,
        send: name => { events.push(name); return true; }, onError: e => { throw e; } });
      return handlers;
    };
    const a = make(); const b = make();
    const trusted = { isTrusted: true } as Event;
    a.get("pointerdown")!(trusted); b.get("keydown")!(trusted);
    expect(events).toEqual([p.returnEvent]);
  });
});
