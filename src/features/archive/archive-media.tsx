import Image from "next/image";
import type { ArchivePresentationEntry } from "./archive-content";
import { getTranslator } from "@/lib/i18n/server";

export async function ArchiveMedia({ entry, sizes }: Readonly<{ entry: ArchivePresentationEntry; sizes: string }>) {
  const tr = await getTranslator();
  return <div className={`archive-media archive-media-${entry.media.tone}`}>
    <Image src={entry.media.src} alt={tr(entry.media.alt)} fill sizes={sizes} style={{ objectFit: "cover", objectPosition: entry.media.objectPosition ?? "center" }} />
  </div>;
}
