import type { ComponentProps } from 'react';
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

const navigation = createNavigation(routing);

export const { redirect, usePathname, useRouter } = navigation;

type LinkProps = ComponentProps<typeof navigation.Link>;

// next.config.ts sets `trailingSlash: true`, and Next adds the slash to the
// rendered <a>, but the href as written still ships in the RSC payload
// inlined in every page. Google picks those strings up and was indexing
// ~200 slash-less variants (each one a 308 to the real URL), so the slash
// goes on here, once, instead of at ~130 call sites.
function withTrailingSlash(path: string): string {
  const lastSegment = path.slice(path.lastIndexOf('/') + 1);
  if (path.endsWith('/') || lastSegment.includes('.')) return path;
  return `${path}/`;
}

function normalizeHref(href: LinkProps['href']): LinkProps['href'] {
  if (typeof href === 'string') {
    if (!href.startsWith('/')) return href;
    const match = href.match(/^([^?#]*)(.*)$/);
    return match ? withTrailingSlash(match[1]) + match[2] : href;
  }
  if (href && typeof href.pathname === 'string') {
    return { ...href, pathname: withTrailingSlash(href.pathname) };
  }
  return href;
}

export function Link(props: LinkProps) {
  const NextIntlLink = navigation.Link;
  return <NextIntlLink {...props} href={normalizeHref(props.href)} />;
}
