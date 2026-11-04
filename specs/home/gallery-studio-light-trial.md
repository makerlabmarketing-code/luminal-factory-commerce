# Gallery → studio light trial — 2026-11-04

## Approved scope

The owner approved trying the supplied LaserFlow reference between the existing
gallery and Made at Luminal. Keep the Home, its section order, gallery interaction,
intro and process folder behavior. This is an incremental effect on Home, not a
replacement concept page.

The existing Lazy → Luminal passage connects these sections. A narrow blue/cyan
beam descends through that passage, meets the first process folder's actual top
edge, spreads over the rim and fades before the folder stack takes over. Scrolling
back reverses the same sequence. Existing copy and controls remain readable.
No process photographs are available: use the existing folder surface, without
inventing making-process imagery. No cursor effect, particles, wheel capture,
scroll locking, extra dependency, database or configuration changes.

## Plan and acceptance

- Server-render the existing content inside a non-clipping relative group.
- Lazy-import a narrow client renderer near the transition; initialize WebGL2
  only on fine-pointer desktop ≥1000px, no reduced motion and no Save-Data.
- Adapt the supplied beam/impact/rim shader to resin blue/cyan, remove pointer
  reveal, fog and particles. Drive progression by scroll, with no idle render loop.
- Measure the real first folder and stable document anchors; cap render resolution.
  Pause offscreen/hidden; disconnect listeners/observers, delete GPU resources and
  stop frames on unmount, context loss or capability changes.
- Phones, touch tablets, reduced motion, unavailable WebGL/chunk failure and
  no JavaScript keep the existing complete Home. No hidden content or layout shift.
- Validate full project gate, forward/reverse, stacking, resize, reduced motion,
  navigation and fallback. Record actual browser verification and its limitations.
