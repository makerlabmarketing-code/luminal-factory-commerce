# Delivery branch

- **Purpose:** Deliver one bounded roadmap slice with traceable validation and operator handoff.
- **Trigger:** A task prepares a commit, direct `master` delivery, exceptional PR,
  review, merge, deployment, or completion report.
- **Required inputs:** Roadmap item, diff/status, validation commands, CI/conflict state, review findings, deployment access, and handoff.
- **Execution:** Confirm bounded scope; run actual checks; inspect diff and classify
  P0/P1/P2; fix related findings; update roadmap/handoff; and commit locally. Under
  the owner-approved early-project policy, accumulate a coherent batch on
  `master`, rebase/fetch-check against `origin/master`, rerun the complete gate,
  and push once. Verify GitHub checks, Vercel `READY`, and the bounded Production
  smoke when access exists. Use an exceptional PR only when external review,
  protected-branch rules or recovery requires it; then describe scope, tests,
  impacts, limitations and gates, and merge only with passing checks, no conflict
  and no open P0/P1.
- **Forbidden:** Claiming unrun checks, merging with unresolved P0/P1, automatic live-system operations, or describing code-complete work as deployed.
- **Expected output:** Commit SHA and, when applicable, PR link or explicit access
  limitation; review result; status evidence; deployment result; known warnings;
  and exact next slice.
- **Validation:** `npm run check`, `git diff --check`, secret-pattern scan, focused manual checks, CI/check inspection, and post-deployment smoke test when authorized.
