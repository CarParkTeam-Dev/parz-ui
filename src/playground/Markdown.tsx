import { Fragment, type ReactNode } from 'react';

/** Маленький рендер Markdown для README: заголовки, абзацы, списки, таблицы, блоки кода, `код`, **жирный**, ссылки. */
function inline(text: string, key = 0): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0, m: RegExpExecArray | null, i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) out.push(<code key={`${key}-${i++}`}>{m[1]}</code>);
    else if (m[2] !== undefined) out.push(<strong key={`${key}-${i++}`}>{m[2]}</strong>);
    else out.push(<a key={`${key}-${i++}`} href={m[4]} target="_blank" rel="noopener noreferrer">{m[3]}</a>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
const cells = (row: string) => row.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map(c => c.trim().replace(/\\\|/g, '|'));
export const slug = (s: string) => s.toLowerCase().replace(/[^a-zа-яё\u0531-\u0556\u0561-\u05870-9]+/gi, '-').replace(/^-|-$/g, '');

export function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r/g, '').split('\n');
  const blocks: ReactNode[] = [];
  let i = 0, k = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    if (l.startsWith('```')) {
      const lang = l.slice(3).trim(), buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) buf.push(lines[i++]);
      i++;
      blocks.push(<pre key={k++} data-lang={lang || undefined}><code>{buf.join('\n')}</code></pre>);
      continue;
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(l);
    if (h) {
      const lvl = h[1].length, Tag = (`h${lvl}`) as 'h1';
      blocks.push(<Tag key={k++} id={slug(h[2])}>{inline(h[2], k)}</Tag>);
      i++; continue;
    }
    if (l.startsWith('|')) {
      const rows: string[] = [];
      while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++]);
      const [head, , ...body] = rows;
      blocks.push(
        <div className="md-table" key={k++}><table>
          <thead><tr>{cells(head).map((c, j) => <th key={j}>{inline(c, j)}</th>)}</tr></thead>
          <tbody>{body.map((r, ri) => <tr key={ri}>{cells(r).map((c, j) => <td key={j}>{inline(c, j)}</td>)}</tr>)}</tbody>
        </table></div>
      );
      continue;
    }
    if (/^- /.test(l)) {
      const items: string[] = [];
      while (i < lines.length && /^- /.test(lines[i])) items.push(lines[i++].slice(2));
      blocks.push(<ul key={k++}>{items.map((t, j) => <li key={j}>{inline(t, j)}</li>)}</ul>);
      continue;
    }
    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#|```|\||- )/.test(lines[i])) buf.push(lines[i++]);
    blocks.push(<p key={k++}>{buf.map((t, j) => <Fragment key={j}>{j ? ' ' : ''}{inline(t, j)}</Fragment>)}</p>);
  }
  return <div className="md">{blocks}</div>;
}
