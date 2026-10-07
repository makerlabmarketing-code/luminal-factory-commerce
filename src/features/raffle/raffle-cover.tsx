'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useTranslator } from '@/lib/i18n/client';

export function RaffleCover({ src, alt, className }: Readonly<{ src: string; alt: string; className: string }>) {
  const [failed, setFailed] = useState(false);
  const tr = useTranslator();
  return <div className={className}>
    {failed ? <p role="status">{tr('Object image unavailable')}</p> : <Image
      src={src} alt={alt} fill sizes="(max-width: 900px) 100vw, 50vw"
      style={{ objectFit: 'cover' }} onError={() => setFailed(true)}
    />}
  </div>;
}
