import type { Lang } from './i18n';

// не все браузеры знают армянский формат дат (часть Chromium и Android) — собираем его сами
const HY_MONTHS = ['հունվարի', 'փետրվարի', 'մարտի', 'ապրիլի', 'մայիսի', 'հունիսի', 'հուլիսի', 'օգոստոսի', 'սեպտեմբերի', 'հոկտեմբերի', 'նոյեմբերի', 'դեկտեմբերի'];

/** «2026-11-12» → «12 ноября 2026 г.» / «November 12, 2026» / «12 նոյեմբերի 2026 թ.» */
export function fmtDate(d: string | undefined, lang: Lang) {
  if (!d) return '';
  const dt = new Date(`${d}T12:00:00`);
  if (isNaN(+dt)) return d;
  if (lang === 'hy') return `${dt.getDate()} ${HY_MONTHS[dt.getMonth()]} ${dt.getFullYear()} թ.`;
  try { return dt.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return d; }
}
