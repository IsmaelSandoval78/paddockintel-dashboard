export type Heading = { id: string; text: string; level: 2 | 3 };

export function extractTOC(markdown: string): Heading[] {
  const headings: Heading[] = [];
  for (const line of markdown.split('\n')) {
    const m = line.match(/^(#{2,3}) (.+)$/);
    if (m) {
      headings.push({
        level: m[1].length as 2 | 3,
        text: m[2].trim(),
        id: slugify(m[2].trim()),
      });
    }
  }
  return headings;
}

export function estimateReadTime(markdown: string): number {
  const words = markdown.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

// Converts the controlled subset of markdown we author into safe HTML.
// Content is written by us (not user-generated), so dangerouslySetInnerHTML
// is safe — but we still escape HTML first before applying inline rules.
export function markdownToHtml(markdown: string): string {
  const lines = markdown.split('\n');
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    const h2 = line.match(/^## (.+)$/);
    if (h2) {
      const id = slugify(h2[1]);
      out.push(`<h2 id="${id}">${applyInline(h2[1])}</h2>`);
      i++; continue;
    }

    const h3 = line.match(/^### (.+)$/);
    if (h3) {
      const id = slugify(h3[1]);
      out.push(`<h3 id="${id}">${applyInline(h3[1])}</h3>`);
      i++; continue;
    }

    if (line.match(/^> /)) {
      const lines2: string[] = [];
      while (i < lines.length && lines[i].match(/^> /)) {
        lines2.push(applyInline(lines[i].slice(2)));
        i++;
      }
      out.push(`<blockquote><p>${lines2.join(' ')}</p></blockquote>`);
      continue;
    }

    if (line.match(/^[•\-] /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[•\-] /)) {
        items.push(`<li>${applyInline(lines[i].slice(2))}</li>`);
        i++;
      }
      out.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    if (line.trim() === '') { i++; continue; }

    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].match(/^#{2,3} /) &&
      !lines[i].match(/^[•\-] /) &&
      !lines[i].match(/^> /)
    ) {
      para.push(lines[i]);
      i++;
    }
    if (para.length) out.push(`<p>${applyInline(para.join(' '))}</p>`);
  }

  return out.join('\n');
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function applyInline(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, (_, linkText, href) => {
      const safe = href.startsWith('http') || href.startsWith('/') ? href : '#';
      const external = href.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a href="${safe}"${external}>${linkText}</a>`;
    });
}
