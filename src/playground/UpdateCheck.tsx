import { useEffect, useState } from 'react';
import { tr, type Lang } from './i18n';
import { fmtDate } from './date';

/** Наш сервер; если он недоступен — публичный реестр npm (он разрешает запросы с любого сайта). */
export const LATEST_URL = 'https://dev.carpark.am/parz-ui/latest.json';
const NPM_URL = 'https://registry.npmjs.org/@carparkteam/parz-ui/latest';
const CHANGELOG_URL = 'https://dev.carpark.am/parz-ui/#/changelog';

type Latest = { version: string; date?: string; notes?: string; from: 'server' | 'npm' };
type State = { s: 'checking' } | { s: 'hidden' } | { s: 'done'; latest: Latest };

async function getJson(url: string, ms: number) {
  const ac = new AbortController();
  const t = window.setTimeout(() => ac.abort(), ms);
  try {
    const r = await fetch(url, { signal: ac.signal, cache: 'no-store' });
    if (!r.ok) throw new Error(String(r.status));
    return await r.json();
  } finally { window.clearTimeout(t); }
}
const isVer = (v: unknown): v is string => typeof v === 'string' && /^\d+\.\d+\.\d+/.test(v);

export async function fetchLatest(): Promise<Latest | null> {
  try {
    const j = await getJson(LATEST_URL, 4000);
    if (isVer(j?.version)) return { version: j.version, date: j.date, notes: j.notes, from: 'server' };
  } catch { /* наш сервер не ответил — пробуем npm */ }
  try {
    const j = await getJson(NPM_URL, 5000);
    if (isVer(j?.version)) return { version: j.version, from: 'npm' };
  } catch { /* нет сети */ }
  return null;
}

/** −1, 0, 1 — как обычное сравнение версий x.y.z */
export function cmpVer(a: string, b: string) {
  const x = a.split(/[.-]/).map(n => parseInt(n, 10) || 0), y = b.split(/[.-]/).map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i] ? 1 : -1;
  return 0;
}


/** Плашка на странице «Что нового»: сверяет версию сайта с последней опубликованной. Без сети — молча прячется. */
export function UpdateCheck({ lang, current }: { lang: Lang; current: string }) {
  const t = (k: string, v?: Record<string, string | number>) => tr(lang, k, v);
  const [st, setSt] = useState<State>({ s: 'checking' });
  const [run, setRun] = useState(0);
  useEffect(() => {
    let alive = true;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) { setSt({ s: 'hidden' }); return; }
    setSt({ s: 'checking' });
    fetchLatest().then(l => { if (alive) setSt(l ? { s: 'done', latest: l } : { s: 'hidden' }); });
    return () => { alive = false; };
  }, [run]);

  if (st.s === 'hidden') return null;
  if (st.s === 'checking') {
    return <div className="up up--checking" role="status"><span className="up-spin" aria-hidden="true" />{t('Проверяем обновления…')}</div>;
  }
  const { latest } = st;
  const c = cmpVer(latest.version, current);
  if (c > 0) {
    return (
      <div className="up up--new" role="status">
        <span className="up-ic" aria-hidden="true"><span className="material-symbols-rounded">arrow_upward</span></span>
        <div className="up-b">
          <b>{t('Вышла версия {v}', { v: `v${latest.version}` })}</b>
          <span>{latest.date ? `${fmtDate(latest.date, lang)} · ` : ''}{t('у вас v{v}', { v: current })}</span>
        </div>
        <a className="up-a" href={latest.notes || CHANGELOG_URL} target="_blank" rel="noopener">{t('Что нового')}<span className="material-symbols-rounded" aria-hidden="true">open_in_new</span></a>
      </div>
    );
  }
  return (
    <div className="up up--ok" role="status">
      <span className="material-symbols-rounded" aria-hidden="true">{c < 0 ? 'science' : 'check_circle'}</span>
      {c < 0 ? t('Предварительная версия v{v} — новее опубликованной', { v: current }) : t('У вас последняя версия')}
      <button className="up-re" onClick={() => setRun(r => r + 1)} aria-label={t('Проверить ещё раз')} title={t('Проверить ещё раз')}>
        <span className="material-symbols-rounded" aria-hidden="true">refresh</span>
      </button>
    </div>
  );
}
