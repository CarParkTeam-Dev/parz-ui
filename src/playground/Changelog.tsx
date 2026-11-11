import type { CSSProperties, ReactNode } from 'react';
import { inline } from './Markdown';
import { tr, type Lang } from './i18n';
import { fmtDate } from './date';

/* ---------- разбор CHANGELOG*.md: шапка, выпуски, группы «Добавлено / Исправлено …» ---------- */
type Group = { kind: Kind; title: string; items: string[] };
type Release = { version: string; date?: string; next: boolean; text: string[]; groups: Group[] };
type Kind = 'added' | 'fixed' | 'changed' | 'removed' | 'other';

// названия групп на трёх языках → вид метки
const KINDS: [Kind, RegExp][] = [
  ['added', /^(added|добавлено|ավելացվել)/i],
  ['fixed', /^(fixed|исправлено|ուղղվել)/i],
  ['changed', /^(changed|изменено|փոխվել)/i],
  ['removed', /^(removed|удалено|հեռացվել)/i]
];
const ICON: Record<Kind, string> = { added: 'add', fixed: 'build', changed: 'sync_alt', removed: 'remove', other: 'circle' };

export function parseChangelog(md: string) {
  const lines = md.replace(/\r/g, '').split('\n').filter(l => !l.includes('(CHANGELOG'));
  let title = '', intro = '';
  const releases: Release[] = [];
  let cur: Release | null = null, group: Group | null = null, inCode = false;
  for (const l of lines) {
    if (l.startsWith('```')) { inCode = !inCode; continue; }
    if (inCode) continue;
    if (l.startsWith('# ')) { title = l.slice(2).trim(); continue; }
    const h2 = /^## (.+)$/.exec(l);
    if (h2) {
      const [v, d] = h2[1].split(/\s+—\s+/);
      cur = { version: v.trim(), date: d?.trim(), next: /^unreleased$/i.test(v.trim()), text: [], groups: [] };
      releases.push(cur); group = null; continue;
    }
    const h3 = /^### (.+)$/.exec(l);
    if (h3 && cur) {
      const t = h3[1].trim();
      group = { kind: KINDS.find(([, re]) => re.test(t))?.[0] ?? 'other', title: t, items: [] };
      cur.groups.push(group); continue;
    }
    if (/^- /.test(l) && group) { group.items.push(l.slice(2)); continue; }
    if (!l.trim()) continue;
    if (cur) cur.text.push(l.trim());
    else if (!intro) intro = l.trim(); // первый абзац шапки — подзаголовок страницы
  }
  // пустой «Unreleased» сразу после выпуска не показываем
  return { title, intro, releases: releases.filter(r => !r.next || r.groups.some(g => g.items.length)) };
}

/** major / minor / patch по разнице с предыдущей версией */
function bumpOf(v: string, prev?: string): 'first' | 'major' | 'minor' | 'patch' {
  if (!prev) return 'first';
  const [a, b] = [v, prev].map(x => x.split('.').map(Number));
  return a[0] !== b[0] ? 'major' : a[1] !== b[1] ? 'minor' : 'patch';
}
const BUMP_LABEL = { first: 'Первый выпуск', major: 'Крупное обновление', minor: 'Новые возможности', patch: 'Исправления' };


export function ChangelogPage({ lang, source, install, check, footer }: { lang: Lang; source: string; install: ReactNode; check?: ReactNode; footer: ReactNode }) {
  const t = (k: string, v?: Record<string, string | number>) => tr(lang, k, v);
  const { title, intro, releases } = parseChangelog(source);
  const shipped = releases.filter(r => !r.next);
  const latest = shipped[0];
  const count = shipped.reduce((n, r) => n + r.groups.reduce((m, g) => m + g.items.length, 0), 0);

  return (
    <main className="page cl">
      <section className="cl-hero">
        <div className="cl-blob" aria-hidden="true"><i /><i /><i /></div>
        <span className="cl-kicker"><span className="material-symbols-rounded" aria-hidden="true">history</span>Changelog</span>
        <h1>{title}</h1>
        {intro && <p>{inline(intro)}</p>}
        <div className="cl-stats">
          {latest && <div><b>v{latest.version}</b><span>{t('Текущая версия')}</span></div>}
          <div><b>{shipped.length}</b><span>{t('Выпусков')}</span></div>
          <div><b>{count}</b><span>{t('Изменений')}</span></div>
        </div>
        {check}
        {install}
      </section>

      <ol className="cl-line" aria-label={title}>
        {releases.map((r, i) => {
          const idx = shipped.indexOf(r);
          const bump = r.next ? null : bumpOf(r.version, shipped[idx + 1]?.version);
          const isLatest = r === latest;
          return (
            <li key={r.version} className={`cl-rel${r.next ? ' is-next' : ''}${isLatest ? ' is-latest' : ''}`} style={{ '--i': i } as CSSProperties}>
              <span className="cl-dot" aria-hidden="true" />
              <article className="cl-card">
                <header className="cl-h">
                  {r.next
                    ? <h2><span className="cl-soon">{t('В следующем обновлении')}</span></h2>
                    : <h2><span className="cl-v">v{r.version}</span></h2>}
                  <div className="cl-meta">
                    {r.next && <span className="cl-tag cl-tag--wip"><i aria-hidden="true" />{t('В работе')}</span>}
                    {isLatest && <span className="cl-tag cl-tag--latest">{t('Последняя')}</span>}
                    {bump && <span className={`cl-tag cl-tag--${bump}`}>{t(BUMP_LABEL[bump])}</span>}
                    {r.date && <time dateTime={r.date}>{fmtDate(r.date, lang)}</time>}
                  </div>
                </header>
                {r.text.length > 0 && <p className="cl-text">{inline(r.text.join(' '))}</p>}
                {r.groups.filter(g => g.items.length).map(g => (
                  <section key={g.title} className={`cl-g cl-g--${g.kind}`}>
                    <h3><span className="material-symbols-rounded" aria-hidden="true">{ICON[g.kind]}</span>{g.title}<small>{g.items.length}</small></h3>
                    <ul>{g.items.map((it, j) => <li key={j}>{inline(it, j)}</li>)}</ul>
                  </section>
                ))}
              </article>
            </li>
          );
        })}
      </ol>
      {footer}
    </main>
  );
}
