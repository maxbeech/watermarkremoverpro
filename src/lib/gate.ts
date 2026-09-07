// ─────────────────────────────────────────────────────────────────────────────
// GENERATED FILE — do not edit here.
// Canonical source: _services/stripe-guard/gate.ts in the ProductFactory repo.
// Edit that, then re-run  node _services/stripe-guard/install.mjs --write
// ─────────────────────────────────────────────────────────────────────────────
//
// The front gate: one call, immediately after signature verification, that
// answers "is this event this product's?" for the whole handler.
//
// The alternative was to guard each branch of each of ~49 webhook handlers
// individually, which is 49 chances to miss one — and missing one is exactly
// how a Patent77 customer got a Job13 receipt. One gate before the switch
// protects every branch, including branches added later by someone who has
// never read this file.
//
// It decides ownership by price id and nothing else (see ./stripe-guard), and
// it REFUSES when it cannot establish ownership. Refusing is the safe verdict:
// a product that cannot name its own prices cannot tell its sales from another
// product's, and acting on a stranger's payment is worse than not acting on
// your own — the payment is still in Stripe, still retryable, still visible.

import {
  catalogueIds,
  ownershipOfPrice,
  ownershipOfPrices,
  priceCatalogue,
  pricesFromInvoiceLines,
  type Ownership,
  type PriceCatalogue,
} from "./stripe-guard";

/** A Stripe price id, as Stripe issues them. */
const PRICE_ID = /^price_[A-Za-z0-9]+$/;

/**
 * Discover this product's prices from its own environment.
 *
 * Deliberately derived rather than declared per product: the products name
 * their price variables differently (`STRIPE_PRICE_PRO`, `STRIPE_PRICE_SCALE`,
 * `NEXT_PUBLIC_STRIPE_PRICE_MONTHLY`, `…_LEGACY` lists), and a hand-maintained
 * mapping for 49 repositories is a mapping that goes stale. Any environment
 * variable mentioning STRIPE and PRICE whose value is a Stripe price id counts.
 *
 * The plan label is taken from the variable name and is only ever used for
 * logging: the gate answers ownership, and each handler keeps its own
 * price → plan mapping. Nothing downstream depends on this label.
 */
export function catalogueFromEnv(env: Record<string, string | undefined> = process.env): PriceCatalogue {
  const plans: Record<string, string[]> = {};
  for (const [key, raw] of Object.entries(env)) {
    const upper = key.toUpperCase();
    if (!upper.includes("STRIPE") || !upper.includes("PRICE")) continue;
    const ids = (raw ?? "").split(",").map((v) => v.trim()).filter((v) => PRICE_ID.test(v));
    if (ids.length === 0) continue;
    const label =
      upper.replace(/_LEGACY$/, "").split("PRICE").pop()?.replace(/^[_-]+/, "").toLowerCase() || "default";
    (plans[label] ??= []).push(...ids);
  }
  return priceCatalogue(plans);
}

/** Event families whose ownership a price id can decide. */
type PriceScoped = { readonly kind: "price"; readonly ownership: Ownership };
/**
 * Event families that carry no price because they are not about a sale —
 * today only Connect `account.*`, which a platform's own webhook identifies by
 * the connected account id instead. The gate passes these through and says so;
 * it does not pretend to have checked them.
 */
type NotPriceScoped = { readonly kind: "not_price_scoped" };

export type GateResult =
  | { readonly ok: true; readonly reason: "owned" | "not_price_scoped"; readonly message: string }
  | { readonly ok: false; readonly reason: "foreign" | "unresolved"; readonly message: string };

/** The minimum of the Stripe client this gate needs, so it stays SDK-agnostic. */
export interface SubscriptionReader {
  subscriptions: {
    retrieve(id: string): Promise<{ items: { data: { price?: { id?: string | null } | null }[] } }>;
  };
}

/** The minimum of a Stripe event this gate needs. */
export interface GateEvent {
  readonly id: string;
  readonly type: string;
  readonly data: { readonly object: unknown };
}

/**
 * Establish whether `event` belongs to this product.
 *
 * Call it once, immediately after `constructEvent`, and return 200 without
 * acting when `ok` is false. Never throw on a refusal: a 5xx makes Stripe
 * retry another product's event at you until it gives up.
 */
export async function guardStripeEvent(
  stripe: SubscriptionReader,
  event: GateEvent,
  catalogue: PriceCatalogue = catalogueFromEnv(),
): Promise<GateResult> {
  if (event.type.startsWith("account.")) {
    return {
      ok: true,
      reason: "not_price_scoped",
      message: `[stripe] ${event.type} ${event.id} carries no price; ownership is the handler's own to establish.`,
    };
  }

  if (catalogueIds(catalogue).length === 0) {
    return {
      ok: false,
      reason: "unresolved",
      message:
        `[stripe] REFUSING ${event.type} ${event.id}: this product has no Stripe price ids in its ` +
        "environment, so it cannot tell its own sales from another product's on a shared account. " +
        "Set STRIPE_PRICE_* to the price ids this product sells and redeploy.",
    };
  }

  const ownership = await ownershipOfEvent(stripe, event, catalogue);
  if (!ownership) {
    return {
      ok: false,
      reason: "unresolved",
      message:
        `[stripe] REFUSING ${event.type} ${event.id}: no price id could be read from it, so ownership ` +
        "cannot be established. NOT falling back to metadata, customer id or client_reference_id — " +
        "on a shared Stripe account those belong to whichever product made the sale.",
    };
  }
  if (ownership.verdict === "owned") {
    return {
      ok: true,
      reason: "owned",
      message: `[stripe] ${event.type} ${event.id} is this product's (price ${ownership.priceId}).`,
    };
  }
  if (ownership.verdict === "foreign") {
    return {
      ok: false,
      reason: "foreign",
      message:
        `[stripe] ignoring ${event.type} ${event.id}: price ${ownership.priceId} belongs to another ` +
        "product on this shared Stripe account.",
    };
  }
  return {
    ok: false,
    reason: "unresolved",
    message:
      `[stripe] REFUSING ${event.type} ${event.id}: ${ownership.reason}. Ownership cannot be established.`,
  };
}

/** Pull the price ids out of whichever object this event carries. */
async function ownershipOfEvent(
  stripe: SubscriptionReader,
  event: GateEvent,
  catalogue: PriceCatalogue,
): Promise<Ownership | null> {
  const object = event.data.object as Record<string, unknown>;

  if (event.type.startsWith("invoice")) {
    const lines = (object.lines as { data?: unknown[] } | undefined)?.data ?? [];
    return ownershipOfPrices(pricesFromInvoiceLines(lines as never[]), catalogue);
  }

  if (event.type.startsWith("customer.subscription")) {
    return ownershipOfPrices(subscriptionPrices(object), catalogue);
  }

  if (event.type.startsWith("checkout.session")) {
    // A checkout session carries no price inline. The subscription it created
    // does, and it is the thing being paid for, so read it from there.
    const sub = object.subscription;
    const id = typeof sub === "string" ? sub : ((sub as { id?: string } | null)?.id ?? null);
    if (!id) return ownershipOfPrice(null, catalogue);
    const full = await stripe.subscriptions.retrieve(id);
    return ownershipOfPrices(subscriptionPrices(full as unknown as Record<string, unknown>), catalogue);
  }

  return null;
}

function subscriptionPrices(sub: Record<string, unknown>): (string | null)[] {
  const items = (sub.items as { data?: { price?: { id?: string | null } | null }[] } | undefined)?.data ?? [];
  return items.map((i) => i.price?.id ?? null);
}
