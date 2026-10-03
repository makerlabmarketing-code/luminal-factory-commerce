# EN/VI storefront

Approved by the owner on 2026-10-03: one storefront in English and Vietnamese,
English default. Coordination source: C-038 in the shared roadmap Sheet.

## Current delivery

- Public UI routes live below `src/app/[locale]`. API routes remain below `src/app/api`.
- `/en` and `/vi` select the language explicitly. An unprefixed GET/HEAD redirects
  to a valid remembered preference, otherwise English; browser language does not override this default.
- EN/VI navigation preserves the route, query, hash and Product slug. Preference is
  saved only on explicit selection in a one-year SameSite=Lax cookie.
- Server Components resolve locale through Next root parameters. Client islands
  receive locale through context. Shared navigation localizes internal UI links only.
- Shop GET forms submit to the active locale. Auth, Cart, Commission and Raffle
  requests keep the original API endpoints, payloads, enum values and server rules.
- Both locales retain Cart private/no-store headers and customer-session refresh.
- Repository-owned copy is reviewed in `src/lib/i18n/copy.json`; no automatic
  machine translation is performed on persisted catalog records.
- Names such as Meowhe, Lolipop and Mictlán retain their spelling. Dates use the
  active language while the release timezone and published currency stay authoritative.
- Metadata declares localized canonical and EN/VI/x-default alternates. The sitemap
  includes public static routes only in Production; private/test/unapproved routes stay excluded.
- Unapproved Shop/Archive fixture studies and the example raffle object are not
  exposed as real public releases. The useful empty/unavailable states remain.
- Existing visual assets, 3D, motion timings and accepted folder behavior are reused.

## Next delivery: ERP content translation contract

Product and Colorway each keep one identity, slug and shared commercial facts.
Localized title/description/story/SEO/media-alt content belongs to a translation
record keyed by entity ID and locale, not a second Product.

The ERP needs EN/VI fields, explicit translation readiness, safe draft/publish
behavior and read-contract support for the storefront. Existing English/source
content remains the truthful fallback until approved translations exist. Never
invent product facts, colorway lore, prices, availability or release timing.

This delivery does not add database tables or apply Production SQL. Prepare the
schema, RLS, read/write contract, rollback and ERP editor as a separate reviewable
package before any live SQL action. Full bilingual catalog content is therefore
pending that delivery and actual translations from the studio.

## Verification

Run `npm run check`; test locale URLs, API exclusions, dictionary parity,
interpolation tokens, domain identity preservation and proxy preference/cache
behavior. Verify both languages across public routes and review desktop/mobile
language controls, current-page switching, query/hash preservation and remembered
preference on Preview before publishing.
