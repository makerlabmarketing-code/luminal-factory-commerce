# Legacy LazyFactory Asset Inventory

Status: `BLOCKED_BY_ENVIRONMENT_NETWORK_POLICY`

Inventory date: 2026-08-06

## Summary

| Measure | Count |
|---|---:|
| Legacy endpoints requested | 3 |
| Pages crawled | 0 |
| Asset URLs discovered | 0 |
| Files downloaded | 0 |
| Failed endpoint requests | 3 |
| Images recovered | 0 |
| Videos recovered | 0 |
| Binary duplicates | 0 |
| Thumbnail-only files | 0 |
| Original candidates | 0 |

The environment's outbound CONNECT proxy returned HTTP 403 before the legacy home page, `robots.txt`, or `sitemap.xml` could be read. Therefore no navigation, collection/project, gallery, commission/process, HTML/CSS/JSON media reference, or referenced CDN host could be evidenced. Zero discovered assets means this inventory contains no invented URL or classification record.

## Collections and recommendations

- **Recognized collections/projects:** none; source content was inaccessible.
- **Best Home candidate:** none.
- **Best Archive candidate:** none.
- **Best Shop candidate:** none.
- **Owner-review assets:** none recovered; all future recovered historical media will require review.
- **Assets not recommended:** no binary was available to assess.

The committed JSON is deterministic evidence of this blocked run and parses as an empty inventory. Run `node scripts/recover-legacy-assets.mjs` in an authorized network environment, then inspect and enrich the generated records (dimensions, transformation evidence, content roles, neutral alt drafts, and shortlist) before committing recovered results. The script writes unapproved binaries only to an ignored staging directory.
