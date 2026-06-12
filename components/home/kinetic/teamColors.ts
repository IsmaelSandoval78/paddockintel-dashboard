// Constructor colors darkened for the light substrate (DESIGN.md §05)
export const TEAM_COLORS: Record<string, string> = {
  mercedes:     '#00A99D',
  mclaren:      '#E57700',
  red_bull:     '#2A5DB0',
  ferrari:      '#D40000',
  alpine:       '#C04080',
  aston_martin: '#2D7A65',
  haas:         '#6A6E70',
  williams:     '#2A7CB0',
  sauber:       '#259825',
  kick_sauber:  '#259825',
  rb:           '#3A5EC4',
  alphatauri:   '#3A5EC4',
  cadillac:     '#8A8A8A',
  audi:         '#9A0000',
};

export function teamColor(ref: string): string {
  return TEAM_COLORS[ref] ?? '#B5B4AE';
}
