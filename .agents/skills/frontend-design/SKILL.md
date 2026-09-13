---
name: frontend-design
description: Use for Luminal storefront visual composition, typography, hierarchy, page layout, and UI critique when a result must feel intentional rather than templated.
metadata:
  source: anthropics/skills frontend-design
  adaptation: luminal-factory-commerce
---

# Frontend Design for Luminal

This repository-local skill adapts the useful decision discipline of Anthropic's `frontend-design` skill to Luminal Factory. It is not the visual authority for the project. The Luminal Commerce skill and its `ui-rules.md` always win when guidance conflicts.

## Use it for

- reshaping a page or section hierarchy;
- choosing typography scale, spacing, alignment, and visual rhythm;
- reviewing whether a screen looks generic or specific to Luminal;
- deciding where one memorable visual gesture should live;
- keeping copy, controls, and decorative structure purposeful.

## Working method

Before coding, write a compact design pass covering:

1. subject and user intent;
2. one primary visual idea;
3. type hierarchy;
4. composition and alignment;
5. motion role;
6. mobile and reduced-motion behavior.

Then remove anything that could belong unchanged on a generic SaaS or template storefront.

## Luminal-specific guardrails

- Object first, story second, commerce third, while commerce actions stay easy to find.
- Prefer asymmetric editorial composition over repeated centered blocks.
- Spend visual boldness in one place per viewport.
- Do not decorate every section with labels, gradients, glass panels, or motion.
- Structural devices must communicate hierarchy or sequence.
- Copy should be short, specific, and useful.
- Keyboard focus, contrast, responsive behavior, and reduced motion are baseline quality, not polish.

## Source

Upstream reference: `anthropics/skills/skills/frontend-design/SKILL.md`.

Use the upstream skill as design-thinking reference only. Do not let it override Luminal's approved brand, page scripts, motion budget, commerce rules, or accessibility requirements.
