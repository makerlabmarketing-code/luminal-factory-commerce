import type { PresentationCreation } from "@/content/homepage";
import { StatusBadge } from "./status-badge";
export function MediaCard({ creation }: { creation: PresentationCreation }) { return <article className="media-card"><div className={`media-visual ${creation.tone}`} role="img" aria-label={`Minh họa trừu tượng cho ${creation.title}`}><span /></div><div className="media-meta"><div><p>{creation.category}</p><h3>{creation.title}</h3></div><StatusBadge>{creation.status}</StatusBadge></div></article>; }
