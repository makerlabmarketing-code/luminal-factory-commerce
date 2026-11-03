"use client";

import { useEffect } from "react";

export function HomeScrollMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-home-scroll-concept]");
    if (!root) return;
    const desktop = matchMedia("(min-width: 1000px) and (min-height: 700px) and (hover: hover) and (pointer: fine)");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let cancelled = false;
    let revision = 0;
    let revert: (() => void) | undefined;
    const update = async () => {
      const current = ++revision;
      revert?.();
      revert = undefined;
      delete root.dataset.enhanced;
      if (!desktop.matches || reduced.matches) return;
      try {
        const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
        if (cancelled || current !== revision) return;
        gsap.registerPlugin(ScrollTrigger);
        const runway = root.querySelector<HTMLElement>("[data-story-runway]");
        const model = root.querySelector<HTMLElement>("[data-story-model]");
        const photos = Array.from(root.querySelectorAll<HTMLElement>("[data-story-photo]"));
        const study = root.querySelector<HTMLElement>("[data-story-study]");
        if (!runway || !model || photos.length !== 3 || !study) return;
        root.dataset.enhanced = "true";
        const context = gsap.context(() => {
          gsap.set(photos, { autoAlpha: 0 });
          gsap.set(study, { autoAlpha: 0 });
          gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: {
            trigger: runway, start: "top top", end: "bottom bottom", scrub: true, invalidateOnRefresh: true,
          } })
            .to(model, { x: () => -window.innerWidth * 0.48, scale: 0.9, duration: 0.85 }, 0.12)
            .to(photos, { autoAlpha: 1, stagger: 0.08, duration: 0.3 }, 0.65)
            .to(model, { autoAlpha: 0, scale: 0.72, duration: 0.5 }, 1.45)
            .to(photos, { left: (index) => `${53 + index * 15}%`, top: "24%", width: "13%", height: "48%", borderRadius: "0.8rem", stagger: 0.04, duration: 0.7 }, 1.55)
            .to(photos, { autoAlpha: 0, y: -25, duration: 0.4 }, 2.75)
            .fromTo(study, { y: 35 }, { y: 0, autoAlpha: 1, duration: 0.5 }, 2.9)
            .to(study, { scale: 1.035, duration: 1.05 }, 3.4);
        }, root);
        revert = () => context.revert();
        ScrollTrigger.refresh();
      } catch {
        // Keep the complete static document when the optional animation chunk fails.
        revert?.();
        delete root.dataset.enhanced;
      }
    };
    const onChange = () => { void update(); };
    onChange();
    desktop.addEventListener("change", onChange);
    reduced.addEventListener("change", onChange);
    return () => {
      cancelled = true;
      revision += 1;
      revert?.();
      delete root.dataset.enhanced;
      desktop.removeEventListener("change", onChange);
      reduced.removeEventListener("change", onChange);
    };
  }, []);
  return null;
}
