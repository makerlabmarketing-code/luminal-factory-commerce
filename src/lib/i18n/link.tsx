'use client';
import Link from 'next/link';
import type { ComponentProps } from 'react';
import { localeHref } from './locale';
import { useLocale } from './client';
export default function LocalizedLink(props: ComponentProps<typeof Link>) {
  const locale = useLocale();
  const href = typeof props.href === 'string' ? localeHref(props.href, locale) : { ...props.href, pathname: props.href.pathname ? localeHref(props.href.pathname, locale) : undefined };
  return <Link {...props} href={href} />;
}
