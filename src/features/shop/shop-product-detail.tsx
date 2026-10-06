import { getTranslator } from '@/lib/i18n/server';
import Link from '@/lib/i18n/link';
import type { ShopPresentationEntry } from './shop-content';
import { ShopGallery } from './shop-gallery';
import { getProductReleases } from './product-release-service';

type ShopProductDetailProps = Readonly<{ entry: ShopPresentationEntry }>;

export async function ShopProductDetail({ entry }: ShopProductDetailProps) {
  const tr = await getTranslator();
  const releases = await getProductReleases(entry.id);
  const facts = entry.objectFacts?.filter(fact => fact.value.trim()) ?? [];
  return <div className="product-detail">
    <Link className="product-back" href="/shop">{tr('Back to collection')}</Link>
    <ShopGallery key={entry.id} entry={entry} identity={<><p className="eyebrow">Luminal Factory · {tr(entry.type)}</p><h1 id="shop-detail-title" tabIndex={-1}>{entry.title}</h1></>}>
      {entry.story.trim() && <section aria-labelledby="product-story-title"><h2 id="product-story-title">{tr('Object story')}</h2><p className="product-story">{tr(entry.story)}</p></section>}
      <section className="product-release" aria-labelledby="product-release-title"><h2 id="product-release-title">{tr('Release details')}</h2>{releases.length ? <ul>{releases.map(release => <li key={release.slug}><span>{tr(release.state === 'current' ? 'Current release' : release.state === 'upcoming' ? 'Upcoming release' : 'Past releases')}</span><Link href={`/raffle/${release.slug}`}>{release.title} · {tr('View raffle')}</Link></li>)}</ul> : <p>{tr('No release is available at the moment.')}</p>}</section>
      {facts.length > 0 && <section aria-labelledby="product-facts-title"><h2 id="product-facts-title">{tr('Object facts')}</h2><dl className="product-facts">{facts.map(fact => <div key={fact.label}><dt>{tr(fact.label)}</dt><dd>{tr(fact.value)}</dd></div>)}</dl></section>}
    </ShopGallery>
  </div>;
}
