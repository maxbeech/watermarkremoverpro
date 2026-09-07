import { describe, expect, it } from "vitest";
import { catalogueFromEnv, guardStripeEvent } from "../src/lib/gate";
import { priceCatalogue } from "../src/lib/stripe-guard";

const OURS = priceCatalogue({ pro: ["price_ours"] });

/** A Stripe client stub: only `subscriptions.retrieve` is ever called. */
function stripeWith(prices: (string | null)[]) {
  return {
    subscriptions: {
      retrieve: async () => ({ data: undefined, items: { data: prices.map((id) => ({ price: { id } })) } }),
    },
  } as never;
}
const noStripe = { subscriptions: { retrieve: async () => { throw new Error("must not be called"); } } } as never;

describe("catalogueFromEnv", () => {
  it("finds price ids whatever the variable is called", () => {
    const c = catalogueFromEnv({
      STRIPE_PRICE_PRO: "price_a",
      NEXT_PUBLIC_STRIPE_PRICE_MONTHLY: "price_b",
      STRIPE_PRICE_SCALE_LEGACY: "price_c,price_d",
    });
    expect(catalogueFromEnvIds(c)).toEqual(["price_a", "price_b", "price_c", "price_d"]);
  });

  it("ignores STRIPE variables that are not price ids", () => {
    const c = catalogueFromEnv({
      STRIPE_SECRET_KEY: "sk_live_xxx",
      STRIPE_WEBHOOK_SECRET: "whsec_xxx",
      STRIPE_PRICE_PRO: "",
      NEXT_PUBLIC_STRIPE_ENABLED: "true",
    });
    expect(catalogueFromEnvIds(c)).toEqual([]);
  });

  it("ignores non-Stripe variables that happen to hold a price id", () => {
    expect(catalogueFromEnvIds(catalogueFromEnv({ SOME_PRICE: "price_a" }))).toEqual([]);
  });
});

function catalogueFromEnvIds(c: ReturnType<typeof priceCatalogue>): string[] {
  return Object.values(c).flat().sort();
}

describe("guardStripeEvent", () => {
  const evt = (type: string, object: unknown) => ({ id: "evt_1", type, data: { object } });

  it("passes a checkout for one of our prices", async () => {
    const r = await guardStripeEvent(
      stripeWith(["price_ours"]),
      evt("checkout.session.completed", { subscription: "sub_1" }),
      OURS,
    );
    expect(r).toMatchObject({ ok: true, reason: "owned" });
  });

  it("refuses a checkout for another product's price", async () => {
    const r = await guardStripeEvent(
      stripeWith(["price_theirs"]),
      evt("checkout.session.completed", { subscription: "sub_1" }),
      OURS,
    );
    expect(r).toMatchObject({ ok: false, reason: "foreign" });
    expect(r.message).toContain("price_theirs");
  });

  it("refuses a checkout with no subscription rather than guessing", async () => {
    const r = await guardStripeEvent(noStripe, evt("checkout.session.completed", {}), OURS);
    expect(r).toMatchObject({ ok: false, reason: "unresolved" });
  });

  it("reads a subscription event's own items without calling Stripe", async () => {
    const r = await guardStripeEvent(
      noStripe,
      evt("customer.subscription.deleted", { items: { data: [{ price: { id: "price_ours" } }] } }),
      OURS,
    );
    expect(r).toMatchObject({ ok: true, reason: "owned" });
  });

  it("reads an invoice's line prices in the current API shape", async () => {
    const r = await guardStripeEvent(
      noStripe,
      evt("invoice.paid", {
        lines: { data: [{ price: null, pricing: { price_details: { price: "price_ours" } } }] },
      }),
      OURS,
    );
    expect(r).toMatchObject({ ok: true, reason: "owned" });
  });

  it("refuses another product's invoice", async () => {
    const r = await guardStripeEvent(
      noStripe,
      evt("invoice.payment_failed", {
        lines: { data: [{ pricing: { price_details: { price: "price_theirs" } } }] },
      }),
      OURS,
    );
    expect(r).toMatchObject({ ok: false, reason: "foreign" });
  });

  it("passes Connect account events through, saying it did not check them", async () => {
    const r = await guardStripeEvent(noStripe, evt("account.updated", {}), OURS);
    expect(r).toMatchObject({ ok: true, reason: "not_price_scoped" });
  });

  it("refuses everything when the product has no price ids configured", async () => {
    const r = await guardStripeEvent(noStripe, evt("invoice.paid", {}), priceCatalogue({}));
    expect(r).toMatchObject({ ok: false, reason: "unresolved" });
    expect(r.message).toContain("STRIPE_PRICE_");
  });

  it("refuses an event type it does not know how to price", async () => {
    const r = await guardStripeEvent(noStripe, evt("charge.succeeded", {}), OURS);
    expect(r).toMatchObject({ ok: false, reason: "unresolved" });
  });
});
