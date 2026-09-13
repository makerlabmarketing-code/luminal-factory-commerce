---
name: vercel-react-best-practices
description: Use for React and Next.js performance review in Luminal Commerce, especially waterfalls, bundle cost, server rendering, client boundaries, re-renders, and loading performance.
metadata:
  source: vercel-labs/agent-skills react-best-practices
  license: MIT upstream
  adaptation: luminal-factory-commerce
---

# React and Next.js Performance for Luminal

This is a focused repository-local companion to Vercel's `react-best-practices` skill. Luminal architecture and commerce trust boundaries remain authoritative.

## Priority order

Review performance in this order:

1. eliminate avoidable request waterfalls;
2. keep heavy code out of the initial client bundle;
3. preserve Server Components by default;
4. minimize data serialized into Client Components;
5. defer non-critical third-party and animation work;
6. stop offscreen rendering or animation work when practical;
7. reduce re-renders only after larger costs are addressed.

## Storefront checklist

For every page or interaction-heavy component, ask:

- Can independent server work start in parallel?
- Can this stay a Server Component?
- Is a heavy dependency loaded only where needed?
- Is below-fold content allowed to defer rendering?
- Are image dimensions/responsive sizes explicit?
- Are decorative assets competing with LCP resources?
- Does continuous animation pause when offscreen?
- Does the page still work with reduced motion?
- Are remote reads cached or tightly timeout-bounded when they are not transactional?

## Luminal-specific decisions

- Do not add a second animation library for a responsibility already owned by CSS, Motion, GSAP, Lenis, Model Viewer, or future R3F.
- Keep 3D isolated. The rest of the page must remain usable while 3D runtime or assets load or fail.
- Prefer one intentional motion system to many small client components.
- Treat mobile GPU and memory cost as a first-class constraint.
- Never trade server trust boundaries or data correctness for a performance shortcut.

## Source

Upstream reference: `vercel-labs/agent-skills/skills/react-best-practices/SKILL.md`.

Use upstream rules as performance guidance, then validate against the actual Luminal code and package scripts.
