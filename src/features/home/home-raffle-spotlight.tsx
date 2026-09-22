"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import type { HomeFeaturedRaffle } from "@/features/raffle/raffle-home-service";
import styles from "./home-raffle-spotlight.module.css";

const OPEN_REVALIDATION_INTERVAL_MS = 15_000;
const MAX_OPEN_REVALIDATIONS = 8;

type CountdownParts = Readonly<{
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  complete: boolean;
}>;

function getCountdown(target: string, now: number): CountdownParts {
  const targetTime = Date.parse(target);
  if (!Number.isFinite(targetTime)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, complete: true };
  }

  const remaining = Math.max(0, targetTime - now);
  const totalSeconds = Math.floor(remaining / 1000);
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
    complete: remaining === 0,
  };
}

function formatOpening(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

function Countdown({ opensAt, onComplete }: Readonly<{ opensAt: string; onComplete(): void }>) {
  const [now, setNow] = useState(() => Date.now());
  const completedRef = useRef(false);
  const countdown = useMemo(() => getCountdown(opensAt, now), [now, opensAt]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!countdown.complete || completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [countdown.complete, onComplete]);

  const cells = [
    ["Days", countdown.days],
    ["Hours", countdown.hours],
    ["Minutes", countdown.minutes],
    ["Seconds", countdown.seconds],
  ] as const;

  return (
    <>
      <p className={styles.countdownLabel}>Opening countdown</p>
      <div className={styles.countdown} aria-hidden="true">
        {cells.map(([unit, value]) => (
          <div className={styles.timeCell} key={unit}>
            <span className={styles.timeValue}>{String(value).padStart(2, "0")}</span>
            <span className={styles.timeUnit}>{unit}</span>
          </div>
        ))}
      </div>
      <p className="sr-only">Raffle dự kiến mở lúc {formatOpening(opensAt)}.</p>
    </>
  );
}

export function HomeRaffleSpotlight({ raffle }: Readonly<{ raffle: HomeFeaturedRaffle }>) {
  const router = useRouter();
  const refreshCountRef = useRef(0);
  const refreshTimerRef = useRef<number | null>(null);
  const [isAwaitingOpenState, setIsAwaitingOpenState] = useState(false);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current !== null) window.clearTimeout(refreshTimerRef.current);
    };
  }, []);

  function requestAuthoritativeOpenState() {
    if (raffle.state !== "scheduled" || refreshCountRef.current >= MAX_OPEN_REVALIDATIONS) return;
    setIsAwaitingOpenState(true);
    refreshCountRef.current += 1;
    router.refresh();

    refreshTimerRef.current = window.setTimeout(() => {
      requestAuthoritativeOpenState();
    }, OPEN_REVALIDATION_INTERVAL_MS);
  }

  const isOpen = raffle.state === "open";
  const canEnter = isOpen && raffle.entryPresentationEnabled;
  const detailHref = `/raffle/${raffle.slug}`;

  return (
    <section className={styles.section} aria-labelledby="home-raffle-title">
      <Container className={styles.grid}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>
            {isOpen ? "Current raffle · Open" : "Upcoming raffle · Sealed"}
          </p>
          <h2 className={styles.title} id="home-raffle-title">{raffle.title}</h2>
          {raffle.summary ? <p className={styles.summary}>{raffle.summary}</p> : null}

          <div className={styles.timing}>
            {isOpen ? (
              <>
                <p className={styles.openLabel}>The window is open</p>
                {raffle.closesAt ? (
                  <p className={styles.summary}>Đóng lúc {formatOpening(raffle.closesAt)}.</p>
                ) : null}
              </>
            ) : (
              <Countdown opensAt={raffle.opensAt} onComplete={requestAuthoritativeOpenState} />
            )}
          </div>

          <div className={styles.actions}>
            {canEnter ? <ButtonLink href={detailHref}>Enter raffle</ButtonLink> : null}
            <Link className="text-link" href={detailHref}>View raffle details <span aria-hidden="true">↗</span></Link>
          </div>

          {!isOpen && isAwaitingOpenState ? (
            <p className={styles.pending} role="status">Đang đồng bộ trạng thái mở raffle từ máy chủ…</p>
          ) : null}
          {isOpen && !raffle.entryPresentationEnabled ? (
            <p className={styles.pending} role="status">Raffle đã mở, kênh nhận entry đang chờ kích hoạt.</p>
          ) : null}
        </div>

        <div className={styles.stage}>
          <div className={styles.frame}>
            {isOpen && raffle.media ? (
              <Image
                className={styles.image}
                src={raffle.media.src}
                alt={raffle.media.alt}
                fill
                priority
                sizes="(max-width: 900px) 100vw, 58vw"
              />
            ) : (
              <div className={styles.questionField} role="img" aria-label={`Teaser bí mật cho ${raffle.title}`}>
                <span className={styles.question} aria-hidden="true">?</span>
                <span className={styles.questionSlice} aria-hidden="true" />
              </div>
            )}
          </div>
          <span className={styles.stageMeta} aria-hidden="true">
            {isOpen ? "Object revealed" : "Luminal sealed object"}
          </span>
        </div>
      </Container>
    </section>
  );
}
