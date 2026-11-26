"use client";

import { useEffect, useId, useRef } from "react";
import styles from "./home-resin-flow.module.css";

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export function HomeResinFlow() {
  const id = useId();
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const main = svg?.closest("main");
    const featured = main?.querySelector<HTMLElement>('[data-home-3d-section="featured"]');
    const gallery = main?.querySelector<HTMLElement>("[data-home-photo-handoff]");
    const grid = gallery?.querySelector<HTMLElement>("[data-home-chapter-photo]");
    if (!svg || !main || !featured || !gallery || !grid) return;

    const copy = featured.querySelector<HTMLElement>("[data-home-flow-mask]");
    const blocks = Array.from(main.querySelectorAll<HTMLElement>("[data-home-flow-mask], [data-home-chapter-photo]"));
    const occluders = Array.from(svg.querySelectorAll("mask rect[data-occluder]"));
    const path = svg.querySelector<SVGPathElement>("[data-flow-path]");
    if (!path) return;
    const stops = Array.from(svg.querySelectorAll("stop"));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let lastTime: number | undefined;
    let dirty = true;
    let start = 0;
    let height = 0;
    let progress = 0;
    let thresholds: number[] = [];

    const render = (now: number) => {
      frame = 0;
      const width = main.clientWidth;
      const mainRect = main.getBoundingClientRect();
      const viewport = window.innerHeight;
      const featuredRect = featured.getBoundingClientRect();
      const galleryRect = gallery.getBoundingClientRect();
      const gridRect = grid.getBoundingClientRect();
      if (!width || !viewport) return;

      if (dirty) {
        const featuredY = featuredRect.top - mainRect.top;
        const galleryY = galleryRect.top - mainRect.top;
        start = Math.max(0, featuredY - viewport * 0.36);
        const narrow = width < 900;
        const copyRect = copy?.getBoundingClientRect();
        const copyX = copyRect ? copyRect.left - mainRect.left + copyRect.width * 0.44 : width * 0.65;
        const copyInset = copy && copy.offsetParent instanceof HTMLElement ? copy.offsetTop : viewport * 0.32;
        const copyY = featuredY - start + copyInset + (copyRect?.height ?? viewport * 0.3) * 0.48;
        const seamY = galleryY - start;
        const gridX = gridRect.left - mainRect.left;
        const gridY = gridRect.top - mainRect.top - start;
        const gridBottom = gridY + gridRect.height;
        const right = width * 0.94;
        const left = width * 0.09;
        const end = gridBottom + Math.min(100, viewport * 0.10);
        height = end + 6;

        svg.style.top = `${start}px`;
        svg.style.height = `${height}px`;
        svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
        path.setAttribute("d", [
          `M ${width * 0.035} 4`,
          `C ${width * 0.16} 4 ${right} ${viewport * 0.09} ${right} ${viewport * 0.34}`,
          `C ${right} ${viewport * 0.52} ${copyX + width * 0.12} ${copyY - viewport * 0.18} ${copyX} ${copyY}`,
          `C ${copyX - width * 0.17} ${copyY + viewport * 0.255} ${left} ${seamY - viewport * 0.61} ${left} ${seamY - viewport * 0.29}`,
          `C ${left} ${seamY + viewport * 0.03} ${width * 0.70} ${seamY + (gridY - seamY) * 0.24} ${right} ${seamY + (gridY - seamY) * 0.48}`,
          `C ${width * 1.18} ${seamY + (gridY - seamY) * 0.72} ${gridX + gridRect.width * 0.67} ${gridY + gridRect.height * 0.29} ${gridX + gridRect.width * 0.53} ${gridY + gridRect.height * 0.47}`,
          `C ${gridX + gridRect.width * 0.39} ${gridY + gridRect.height * 0.65} ${narrow ? width * 0.18 : left} ${gridBottom + viewport * 0.015} ${left} ${end}`,
        ].join(" "));
        const length = path.getTotalLength();
        let lowest = 0;
        thresholds = Array.from({ length: 129 }, (_, index) => {
          const step = index / 128;
          lowest = Math.max(lowest, path.getPointAtLength(step * length).y);
          return 0.87 * lowest + step * height * 0.13;
        });
        stops[1].setAttribute("offset", String(clamp((featuredY - start) / height)));
        stops[2].setAttribute("offset", String(clamp((seamY + viewport * 0.14) / height)));
        dirty = false;
      }

      const drawHead = viewport * 0.80 - mainRect.top - start;
      const next = thresholds.findIndex((threshold) => threshold > drawHead);
      const target = next === -1 ? 1 : next === 0 ? 0
        : (next - 1 + (drawHead - thresholds[next - 1]) / (thresholds[next] - thresholds[next - 1])) / 128;
      const elapsed = lastTime === undefined ? 16 : Math.min(40, now - lastTime);
      lastTime = now;
      const difference = target - progress;
      progress = reducedMotion.matches || Math.abs(difference) < 0.0005
        ? target : progress + difference * (1 - Math.exp(-elapsed / 55));
      svg.style.visibility = progress > 0 ? "visible" : "hidden";
      path.style.strokeDashoffset = String(1 - progress);

      blocks.forEach((block, index) => {
        const cutout = occluders[index];
        const bounds = block.getBoundingClientRect();
        const visible = block === grid
          ? !block.hasAttribute("data-strip")
          : getComputedStyle(block).visibility !== "hidden";
        cutout.setAttribute("width", String(visible ? bounds.width + 12 : 0));
        cutout.setAttribute("height", String(visible ? bounds.height + 12 : 0));
        cutout.setAttribute("x", String(bounds.left - mainRect.left - 6));
        cutout.setAttribute("y", String(bounds.top - mainRect.top - start - 6));
      });
      if (progress !== target) schedule();
      else lastTime = undefined;
    };

    function schedule() {
      if (!frame) frame = window.requestAnimationFrame(render);
    }
    function measure() {
      dirty = true;
      schedule();
    }

    const observer = new ResizeObserver(measure);
    [main, featured, gallery, ...blocks].forEach((item) => observer.observe(item));
    const visibilityObserver = new MutationObserver(schedule);
    if (copy) visibilityObserver.observe(copy, { attributeFilter: ["style"] });
    visibilityObserver.observe(gallery, { attributeFilter: ["data-gallery-motion", "data-gallery-show-heading"] });
    visibilityObserver.observe(grid, { attributeFilter: ["data-strip"] });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", measure);
    reducedMotion.addEventListener("change", schedule);
    schedule();
    return () => {
      observer.disconnect();
      visibilityObserver.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", measure);
      reducedMotion.removeEventListener("change", schedule);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <svg ref={svgRef} className={styles.ribbon} data-home-resin-flow aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-light`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#4eddea" stopOpacity=".74" />
          <stop offset=".15" stopColor="#37c9dd" stopOpacity=".55" />
          <stop offset=".50" stopColor="#27a9ce" stopOpacity=".29" />
          <stop offset="1" stopColor="#37c9dd" stopOpacity=".40" />
        </linearGradient>
        <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
          <rect width="100%" height="100%" fill="white" />
          <rect data-occluder fill="black" rx="7" />
          <rect data-occluder fill="black" rx="7" />
          <rect data-occluder fill="black" rx="7" />
        </mask>
      </defs>
      <path data-flow-path pathLength="1" strokeDasharray="1 1" strokeDashoffset="1"
        mask={`url(#${id}-mask)`} stroke={`url(#${id}-light)`} />
    </svg>
  );
}
