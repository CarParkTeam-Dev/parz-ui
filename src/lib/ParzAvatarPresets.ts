/* Parz UI · готовые рисованные аватары: SVG прямо в коде, без сети и без файлов */
function portrait(bg1: string, bg2: string, skin: string, hair: string, shirt: string, long = false) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></linearGradient></defs>`
    + `<rect width="120" height="120" fill="url(#g)"/>`
    + (long ? `<path d="M30 58c0-24 12-38 30-38s30 14 30 38v34H30z" fill="${hair}"/>` : '')
    + `<path d="M16 120c2-24 20-36 44-36s42 12 44 36z" fill="${shirt}"/>`
    + `<rect x="51" y="66" width="18" height="22" rx="8" fill="${skin}"/>`
    + `<ellipse cx="60" cy="54" rx="21" ry="24" fill="${skin}"/>`
    + `<path d="M38 50c0-16 10-25 22-25s22 9 22 25c-6-8-14-11-22-11s-16 3-22 11z" fill="${hair}"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Готовые рисованные аватары для окна выбора (ParzAvatar с editable). Можно передать свои через presets. */
export const PARZ_AVATAR_PRESETS: string[] = [
  portrait('#ffd6a8', '#ff9a8b', '#f1c6a3', '#3b2a22', '#2f6fde'),
  portrait('#b8e1ff', '#7aa7ff', '#c98e6b', '#1d1a19', '#f2545b', true),
  portrait('#c8f5d8', '#62e0a1', '#e8b895', '#a0522d', '#5a46e8'),
  portrait('#e7d6ff', '#a98bff', '#8d5b3e', '#141010', '#17a66a'),
  portrait('#fff0b8', '#ffc163', '#f6d2b8', '#d9a43a', '#26262e', true),
  portrait('#ffd1e6', '#ff86d6', '#b57852', '#2a1c14', '#119c90'),
  portrait('#d6f0ff', '#5fd3ff', '#f0c09a', '#6b3b1f', '#ff8a3d', true)
];
