import { describe, expect, it } from "vitest";
import {
  catalogueIds,
  ownershipOfPrice,
  ownershipOfPrices,
  priceCatalogue,
  pricesFromInvoiceLines,
  refusalMessage,
} from "../src/lib/stripe-guard";

const OURS = priceCatalogue({
  pro: ["price_ourpro", "price_ourpro_legacy"],
  scale: ["price_ourscale"],
});

describe("priceCatalogue", () => {
  it("drops unset and blank env values rather than storing empty strings", () => {
    const c = priceCatalogue({ pro: ["price_a", undefined], scale: [null, "  "] });
    expect(c).toEqual({ pro: ["price_a"] });
    expect(catalogueIds(c)).toEqual(["price_a"]);
  });

  it("de-duplicates a price id listed twice", () => {
    expect(priceCatalogue({ pro: ["price_a", "price_a"] })).toEqual({ pro: ["price_a"] });
  });
});

describe("ownershipOfPrice", () => {
  it("claims our own price and names the plan it grants", () => {
    expect(ownershipOfPrice("price_ourscale", OURS)).toEqual({
      verdict: "owned",
      priceId: "price_ourscale",
      plan: "scale",
    });
  });

  it("claims a grandfathered legacy price for the plan that lists it", () => {
    expect(ownershipOfPrice("price_ourpro_legacy", OURS)).toMatchObject({
      verdict: "owned",
      plan: "pro",
    });
  });

  it("refuses another product's price on the shared account", () => {
    // The Patent77 price, seen by Job13's endpoint. This is the exact event
    // that emailed a Patent77 customer a Job13 receipt on 2026-09-07.
    expect(ownershipOfPrice("price_1U5QI0L2dBF8QalL1vueRIyO", OURS)).toEqual({
      verdict: "foreign",
      priceId: "price_1U5QI0L2dBF8QalL1vueRIyO",
    });
  });

  it("refuses, rather than guesses, when the event carries no price", () => {
    expect(ownershipOfPrice(null, OURS)).toEqual({
      verdict: "unresolved",
      reason: "no_price_on_event",
    });
    expect(ownershipOfPrice("", OURS)).toMatchObject({ verdict: "unresolved" });
  });

  it("refuses everything when the product has no prices configured", () => {
    // A product with no STRIPE_PRICE_* set cannot distinguish its own sales, so
    // it must claim nothing — not fall through to "probably ours".
    expect(ownershipOfPrice("price_ourpro", priceCatalogue({}))).toEqual({
      verdict: "unresolved",
      reason: "no_prices_configured",
    });
  });

  it("does not match a missing price id against a blank configured value", () => {
    const sloppy = priceCatalogue({ pro: [process.env.DEFINITELY_UNSET_PRICE] });
    expect(ownershipOfPrice("", sloppy)).toMatchObject({ verdict: "unresolved" });
  });
});

describe("ownershipOfPrices", () => {
  it("claims a subscription whose every item is ours", () => {
    expect(ownershipOfPrices(["price_ourpro"], OURS)).toMatchObject({ verdict: "owned", plan: "pro" });
  });

  it("refuses a mixed subscription rather than claiming the part that is ours", () => {
    expect(ownershipOfPrices(["price_ourpro", "price_theirs"], OURS)).toEqual({
      verdict: "foreign",
      priceId: "price_theirs",
    });
  });

  it("ignores null items and refuses when nothing resolvable is left", () => {
    expect(ownershipOfPrices([null, undefined], OURS)).toEqual({
      verdict: "unresolved",
      reason: "no_price_on_event",
    });
  });
});

describe("refusalMessage", () => {
  it("names the foreign price so a shared-account leak is greppable", () => {
    const msg = refusalMessage(ownershipOfPrice("price_theirs", OURS), "checkout.session.completed", "evt_1");
    expect(msg).toContain("price_theirs");
    expect(msg).toContain("another product");
  });

  it("tells an unconfigured product what to actually do", () => {
    const msg = refusalMessage(ownershipOfPrice("price_x", priceCatalogue({})), "invoice.paid", "evt_2");
    expect(msg).toContain("STRIPE_PRICE_");
  });
});

describe("pricesFromInvoiceLines", () => {
  it("reads the current API shape, where line.price is null", () => {
    // Verbatim from live invoice in_1UCyTjL2dBF8QalLO2WipGWf.
    const lines = [
      {
        price: null,
        pricing: { price_details: { price: "price_1U5QI0L2dBF8QalL1vueRIyO", product: "patent77_pro" } },
      },
    ];
    expect(pricesFromInvoiceLines(lines)).toEqual(["price_1U5QI0L2dBF8QalL1vueRIyO"]);
  });

  it("still reads the older line.price.id shape", () => {
    expect(pricesFromInvoiceLines([{ price: { id: "price_old" } }])).toEqual(["price_old"]);
  });

  it("yields null — not a guess — for a line with neither shape", () => {
    expect(pricesFromInvoiceLines([{}])).toEqual([null]);
    expect(ownershipOfPrices(pricesFromInvoiceLines([{}]), OURS)).toMatchObject({
      verdict: "unresolved",
    });
  });
});
