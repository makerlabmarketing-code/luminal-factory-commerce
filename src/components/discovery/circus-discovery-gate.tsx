"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./circus-discovery-gate.module.css";

type CircusDiscoveryGateProps = Readonly<{
  id: string;
  stageId?: string;
  heading: string;
  invitation: string;
  actionLabel: string;
  storyLabel: string;
  storyHeading: string;
  storyBody: string;
  bubbles?: ReactNode;
  children: ReactNode;
  initiallyOpen?: boolean;
}>;

export function CircusDiscoveryGate({ id, stageId, heading, invitation, actionLabel, storyLabel, storyHeading, storyBody, bubbles, children, initiallyOpen = false }: CircusDiscoveryGateProps) {
  const [revealed, setRevealed] = useState(initiallyOpen);
  const [flashing, setFlashing] = useState(false);
  const timer = useRef<number | null>(null);
  const content = useRef<HTMLDivElement>(null);

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
  }, []);

  const focusReveal = () => window.requestAnimationFrame(() => {
    content.current?.focus({ preventScroll: true });
    content.current?.scrollIntoView({ block: "start", behavior: "auto" });
  });

  const open = () => {
    if (revealed || flashing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRevealed(true);
      focusReveal();
      return;
    }
    setFlashing(true);
    timer.current = window.setTimeout(() => {
      setFlashing(false);
      setRevealed(true);
      timer.current = null;
      focusReveal();
    }, 420);
  };

  const story = <>
    <div className={styles.story}>
      <p className={styles.eyebrow}>{storyLabel}</p>
      <h2>{storyHeading}</h2>
      <p>{storyBody}</p>
    </div>
    {bubbles ? <div className={styles.bubbleField}>{bubbles}</div> : null}
  </>;

  return (
    <section id={stageId} className={styles.discovery} data-open={revealed} data-flashing={flashing} aria-label={heading}>
      {!initiallyOpen && <div className={styles.tent} data-open={revealed}>
        <div className={styles.canopy} aria-hidden="true">
          <span className={styles.sceneClosed} />
          <span className={styles.sceneOpen} />
        </div>
        {!revealed && <button type="button" className={styles.hotspot} onClick={open} disabled={flashing} aria-label={actionLabel} aria-expanded={false} aria-controls={id} />}
        {!revealed && <div className={styles.tentCopy}>
          <p className={styles.eyebrow}>LUMINAL FACTORY / MEOWHE</p>
          <h2>{heading}</h2>
          <p>{invitation}</p>
          <button type="button" className={styles.enter} aria-expanded={false} aria-controls={id} onClick={open} disabled={flashing}>
            <span>{actionLabel}</span><span aria-hidden="true">↗</span>
          </button>
        </div>}
        <div id={id} className={styles.stageReveal} hidden={!revealed} ref={content} tabIndex={-1}>{story}</div>
      </div>}
      <div className={styles.flash} aria-hidden="true" data-active={flashing} />
      {initiallyOpen && <div id={id} className={styles.reveal} ref={content} tabIndex={-1}>{story}</div>}
      <div className={styles.results} hidden={!revealed}>{children}</div>
    </section>
  );
}
