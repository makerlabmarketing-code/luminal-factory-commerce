# RAFFLE-DISCOVERY-02 — C-041

Status: APPROVED_BOUNDED_LIST_FOUNDATION — owner continuation on 2026-10-07.
Scope: existing route, public list states and navigation only. Final art direction,
public media, entry rules and payment activation remain separate gates.
Owner requested roadmap continuation while collecting Product layout references
on 2026-10-07. Implement independent read/state preparation; keep C-040 redesign
pending references. No entry/payment activation, live DDL or new published data.

## Experience

Purpose: help collectors find an announced release and understand its actual
participation window. Primary action: open a published release detail. A release
card never submits an entry. Desktop uses the existing content grid; mobile
reads title/status, object image, release summary, window/timezone, detail link.
One h1. Reserve image dimensions and preserve keyboard focus and reduced motion.
No new cinematic motion or sticky layout is required for this foundation.

List order: open, upcoming (nearest first), closed, completed, cancelled.
Cards show approved name, image if available, status, exact dates and
Asia/Ho_Chi_Minh timezone. Omit unconfirmed price, edition size, rules and facts.
An expired OPEN row is presented as closed, never as accepting entries. A stale
SCHEDULED row is omitted rather than promoted to OPEN. Cancelled releases cannot
offer entry. Operational drawing/payment/fulfillment states are grouped as closed
to participation; do not describe these as sold out or completed.

## Empty and unavailable

- Disabled reader: neutral release-information unavailable; no claims about a
  future release, schedule, or count of current raffles.
- Successful zero-row read: no announced releases; links to Archive and Shop.
- Read/configuration/shape failure: information unavailable, retry by reload;
  never claim that all releases are closed or that no release exists.
- No fictitious object-study cards, countdown, subscription form or social URL.

Detail order: identity/status → published gallery → confirmed window/timezone →
approved rules → permitted entry action → approved FAQ → Archive navigation.
Entry action requires existing independent server/runtime gates. Countdown, if
later approved, must not grant eligibility or promote stale states by client time.

## Technical scope and tasks

1. Prepared server-only public-key list adapter over existing raffles table,
   explicit fields and filters, bounded 30-row snapshot, no-store, 8-second timeout.
2. Validated response model separates disabled/unavailable/empty/ready; validates
   publication, non-test, safe identity, release time and lifecycle.
3. Wire list to existing route with canonical EN/VI consumer copy. Use text-first
   release cards until approved public media binding is available.
4. Asset resolution must bind to published parent Product and selected Colorway;
   private E-007 uploads are not a public source. Follow C-040 gallery isolation.
5. Verify both locales, mobile/desktop, headings, links, errors and all state
   boundaries. Existing entry integrity tests remain mandatory before activation.

## Exit criteria and input

Preparation exit: adapter tests and repository gate pass, no live data mutation,
reviewable script delivered and canonical roadmap records pending decisions.
Page exit: approved script, actual assets/rules, state UI checks and deployment
smoke. Owner must confirm entry limits/eligibility, selection description,
payment deadline, shipping policy and public FAQ. No business defaults invented.

Rollback: revert the new adapter and gallery resolution hint. No schema rollback.
