// ─────────────────────────────────────────────────────────────────────────────
// GENERATED FILE — do not edit here.
// Canonical source: _services/stripe-guard/stripe-guard.ts in the
// ProductFactory repo. Edit that, then re-run
//   node _services/stripe-guard/install.mjs --write
// ─────────────────────────────────────────────────────────────────────────────
//
// Does this Stripe event belong to THIS product?
//
// Products in the factory share a Stripe account, so every product's webhook
// endpoint receives EVERY event on that account — a purchase on Patent77 is
// delivered to Job13, PermitBird, Contextely, Trial0 and Lugbird as well. A
// handler that reads the event without first asking "is this mine?" acts on
// another product's customer. That is not hypothetical: on 2026-09-07 a
// customer paid $49 for Patent77 Pro and was emailed a "Job13 Pro is active
// ($39/month)" confirmation, because Job13's handler accepted the session's
// `client_reference_id` as one of its own user ids and its `metadata.plan` as
// one of its own plans. Both fields were real — they just belonged to a
// different product.
//
// The rule this module exists to enforce:
//
//   Ownership is decided by PRICE ID and nothing else.
//
// A price id is issued by Stripe, is unique across the account, and is already
// configured per product (STRIPE_PRICE_PRO / STRIPE_PRICE_SCALE / …). Every
// other candidate discriminator is a field the paying product filled in for
// its own purposes and is therefore meaningless — or actively misleading —
// when read by a different product:
//
//   • `client_reference_id` / `metadata.user_id` — an id in ANOTHER product's
//     user table. Non-null, well-formed, and not yours.
//   • `metadata.plan` — "pro" means a different plan at a different price in
//     every product that sells one.
//   • `customer` / `customer_details.email` — one shopper can buy from several
//     products on the same account, so the customer is genuinely shared.
//   • the statement descriptor, the product NAME, a price nickname — display
//     strings, editable in the dashboard, never an identity.
//
// There is deliberately no fallback. If the price cannot be resolved the
// verdict is `unresolved`, and an unresolved event must be acknowledged and
// left alone rather than guessed at: a wrong guess either grants a stranger a
// paid plan or emails someone else's customer, and both are worse than a
// webhook a human has to look at.

/**
 * The prices this product sells, plan id → the price ids that grant it.
 *
 * More than one id per plan is normal and expected: rotating a price leaves
 * grandfathered subscribers on the old id, and that subscriber is still a
 * paying customer of this product. Build it from env (never hardcode ids), and
 * include the legacy ids.
 */
export type PriceCatalogue = Readonly<Record<string, readonly string[]>>;

/** What a webhook handler is allowed to do with an event. */
export type Ownership =
  /** Ours. `plan` is the plan the paid price grants. Act on it. */
  | { readonly verdict: "owned"; readonly priceId: string; readonly plan: string }
  /** Another product's sale on the shared account. Acknowledge; do nothing. */
  | { readonly verdict: "foreign"; readonly priceId: string }
  /**
   * No price could be read from the event. NOT a licence to fall back to
   * metadata — acknowledge, do nothing, and surface `reason` in the log so the
   * gap is visible. `reason` is a stable machine key; see `unresolvedReason`.
   */
  | { readonly verdict: "unresolved"; readonly reason: UnresolvedReason };

export type UnresolvedReason =
  /** The event carried no price id at all (e.g. an unexpanded object). */
  | "no_price_on_event"
  /** The catalogue is empty — this product has no configured prices. */
  | "no_prices_configured";

/**
 * Build a catalogue from env values, dropping the ones that are unset.
 *
 * Passing `undefined` for an unconfigured plan is the normal case (a product
 * with no Scale tier), and it must not become the empty string — `""` would
 * match a missing price id on an event and silently claim a foreign sale.
 */
export function priceCatalogue(
  plans: Readonly<Record<string, readonly (string | undefined | null)[]>>,
): PriceCatalogue {
  const out: Record<string, readonly string[]> = {};
  for (const [plan, ids] of Object.entries(plans)) {
    const clean = ids.filter((id): id is string => typeof id === "string" && id.trim() !== "");
    if (clean.length > 0) out[plan] = Object.freeze([...new Set(clean)]);
  }
  return Object.freeze(out);
}

/** Every price id in the catalogue, for logging and assertions. */
export function catalogueIds(catalogue: PriceCatalogue): readonly string[] {
  return Object.freeze(Object.values(catalogue).flat());
}

/**
 * Decide whether a price id belongs to this product.
 *
 * `priceId` is whatever the caller could read off the event — `null` when the
 * event carried none. This is the whole decision; everything else in this
 * module is plumbing around it.
 */
export function ownershipOfPrice(
  priceId: string | null | undefined,
  catalogue: PriceCatalogue,
): Ownership {
  const ids = catalogueIds(catalogue);
  if (ids.length === 0) return { verdict: "unresolved", reason: "no_prices_configured" };
  if (!priceId) return { verdict: "unresolved", reason: "no_price_on_event" };
  for (const [plan, planIds] of Object.entries(catalogue)) {
    if (planIds.includes(priceId)) return { verdict: "owned", priceId, plan };
  }
  return { verdict: "foreign", priceId };
}

/**
 * Decide ownership from several candidate price ids — a subscription's items,
 * or a checkout session's line items.
 *
 * A subscription carrying prices from two different products cannot happen on
 * a correctly-configured account (each checkout sells one product's prices),
 * and if it ever did, treating it as ours would let a $1 add-on unlock a $199
 * plan. So: ours only if EVERY resolved price is ours, and foreign the moment
 * one is not.
 */
export function ownershipOfPrices(
  priceIds: readonly (string | null | undefined)[],
  catalogue: PriceCatalogue,
): Ownership {
  const present = priceIds.filter((id): id is string => typeof id === "string" && id !== "");
  if (present.length === 0) return ownershipOfPrice(null, catalogue);
  const verdicts = present.map((id) => ownershipOfPrice(id, catalogue));
  const foreign = verdicts.find((v) => v.verdict === "foreign");
  if (foreign) return foreign;
  const unresolved = verdicts.find((v) => v.verdict === "unresolved");
  if (unresolved) return unresolved;
  // Highest-priced plan wins when a subscription legitimately carries several
  // of our own prices; the caller orders the catalogue, so take the last match.
  return verdicts[verdicts.length - 1]!;
}

/**
 * A one-line log message for an event this product refused to act on.
 *
 * Refusals must be visible: silence here looks exactly like "no purchase
 * happened", which is how a genuinely broken price configuration hides for
 * weeks. Always log this; never throw — throwing returns a 5xx and makes
 * Stripe retry another product's event forever.
 */
export function refusalMessage(ownership: Ownership, eventType: string, eventId: string): string {
  if (ownership.verdict === "foreign") {
    return `[stripe] ignoring ${eventType} ${eventId}: price ${ownership.priceId} belongs to another product on this shared Stripe account.`;
  }
  if (ownership.verdict === "unresolved") {
    return ownership.reason === "no_prices_configured"
      ? `[stripe] ignoring ${eventType} ${eventId}: this product has no Stripe price ids configured, so it cannot tell its own sales from another product's. Set STRIPE_PRICE_* and redeploy.`
      : `[stripe] ignoring ${eventType} ${eventId}: no price id could be read from the event, so ownership cannot be established. NOT falling back to metadata.`;
  }
  return `[stripe] ${eventType} ${eventId} is owned by this product (price ${ownership.priceId}, plan ${ownership.plan}).`;
}

/**
 * The price ids on an invoice's lines, across both shapes Stripe uses.
 *
 * Verified against a real live invoice on 2026-09-07 (in_1UCyTj…): on the
 * current API version `line.price` is NULL and the id lives at
 * `line.pricing.price_details.price`, while `invoice.subscription` — the
 * obvious other route to the price — is null too and has moved to
 * `invoice.parent.subscription_details.subscription`. Older API versions send
 * `line.price.id`. Reading only one shape yields no price at all, which the
 * guard correctly reports as `unresolved` — i.e. every invoice silently
 * ignored. Both shapes are read here so that cannot happen quietly.
 *
 * Typed structurally rather than against a pinned Stripe.Invoice so this file
 * stays copy-able into products on different SDK majors.
 */
export function pricesFromInvoiceLines(
  lines: readonly {
    readonly price?: { readonly id?: string | null } | null;
    readonly pricing?: { readonly price_details?: { readonly price?: string | null } | null } | null;
  }[],
): readonly (string | null)[] {
  return lines.map((line) => line.pricing?.price_details?.price ?? line.price?.id ?? null);
}
