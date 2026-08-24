// paddockintel.com (apex + www) is the magazine — Story Mode (light editorial).
// hub.paddockintel.com is the Hub dashboard — Data Mode (dark navy). Same deployment,
// split by hostname (see proxy.ts). Digest lives under the magazine host but is Data
// Mode too — not handled here yet, deferred until Digest itself gets built/re-skinned.
const MAGAZINE_HOSTS = new Set(['paddockintel.com', 'www.paddockintel.com']);

export function isMagazineHost(host: string): boolean {
  return MAGAZINE_HOSTS.has(host.split(':')[0]);
}

export type SiteMode = 'data' | 'story';

export function siteModeForHost(host: string): SiteMode {
  return isMagazineHost(host) ? 'story' : 'data';
}
