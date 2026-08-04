# Repository cleanup branch

- **Purpose:** Canonicalize repository content using evidence while preserving unique or uncertain material.
- **Trigger:** A task requests inventory, duplicate detection, dead-code removal, obsolete-file review, or dependency cleanup.
- **Required inputs:** Git-tracked inventory/history, imports/runtime references, route ownership, deployment/build configuration, tests, hashes, and canonical candidate.
- **Execution:** Detect exact hashes, names/capitalization, exports, structural/CSS similarity, repeated tokens/clients/layouts, references, route shadows, and overlapping dependencies; record confidence and risk; remove only after every safe-deletion condition is proven; validate the repository without removed files.
- **Forbidden:** Name-only deletion, broad unrelated formatting, deleting unique content, or assuming an unimported config/route/agent file is dead.
- **Expected output:** Audit table with path, candidate, confidence, usage, canonical owner, action, risk, and safe-now decision; every deletion has evidence.
- **Validation:** Run import/reference and route/config searches, duplicate hashes, `npm run check`, and `git diff --check`.
