"""Карточка пробной версии 1.2 для README (.github/beta-1.2-dark.svg и beta-1.2-light.svg).
Слева — как попробовать (npm i …@next) и новые компоненты; справа — Parz Video как большая доработка.
Цвета, шрифты и фон — из scripts/banner.py, чтобы карточка стояла под баннером как одно целое.
Запуск из папки parz-ui:  python scripts/banner_beta.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from banner import THEMES, FONT, MONO, OUT  # noqa: E402

W, H = 1280, 600
VERSION = '1.2.0-beta.0'

NEW = [
    ('Tabs', 'tabs'),
    ('Expander', 'expander'),
    ('Days', 'days'),
    ('Color Picker', 'color'),
    ('Avatar', 'avatar'),
]

VIDEO = [
    'Playlists &amp; “Up next”',
    'Auto quality',
    'Audio in several languages',
    'Remembers where you stopped',
    'Share link',
    'Touch &amp; iOS Safari fixes',
]


def icon(kind, c, x, y):
    """Маленькие значки компонентов 28×28, рисуются линиями."""
    s = f'fill="none" stroke="{c["acc"]}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"'
    if kind == 'tabs':
        return (f'<rect x="{x}" y="{y + 8}" width="28" height="12" rx="6" {s}/>'
                f'<rect x="{x + 2.5}" y="{y + 10.5}" width="11" height="7" rx="3.5" fill="{c["acc"]}"/>')
    if kind == 'expander':
        return (f'<rect x="{x}" y="{y + 3}" width="28" height="22" rx="5" {s}/>'
                f'<line x1="{x}" x2="{x + 28}" y1="{y + 12}" y2="{y + 12}" {s}/>'
                f'<path d="M{x + 18} {y + 6.5} l3 2.5 l3 -2.5" {s}/>')
    if kind == 'days':
        return ''.join(f'<rect x="{x + i * 10}" y="{y + 7}" width="8" height="14" rx="3" '
                       + (f'fill="{c["acc"]}"' if i == 1 else s) + '/>' for i in range(3))
    if kind == 'color':
        return (f'<circle cx="{x + 14}" cy="{y + 14}" r="12" {s}/>'
                f'<circle cx="{x + 14}" cy="{y + 14}" r="5" fill="{c["acc"]}"/>')
    if kind == 'avatar':
        return (f'<circle cx="{x + 14}" cy="{y + 14}" r="12" {s}/>'
                f'<circle cx="{x + 14}" cy="{y + 11}" r="4" {s}/>'
                f'<path d="M{x + 7} {y + 22} a8 6 0 0 1 14 0" {s}/>'
                f'<circle cx="{x + 24}" cy="{y + 23}" r="3.5" fill="{c["acc"]}" stroke="{c["bg"]}" stroke-width="1.5"/>')
    return ''


def player(c, x, y, w):
    """Мини-плеер: кадр, стеклянная панель снизу, таймлайн с главами, карточка «Up next»."""
    h = round(w * 9 / 16)
    bar_y = y + h - 54
    tl_x, tl_w = x + 20, w - 40
    chapters = [.28, .55, .8]
    play = f'<path d="M{x + 30} {bar_y + 28} v14 l12 -7 z" fill="#ffffff"/>'
    ticks = ''.join(f'<rect x="{tl_x + tl_w * t - 1}" y="{bar_y + 9}" width="2" height="6" fill="#000000" opacity=".55"/>' for t in chapters)
    prog = (f'<rect x="{tl_x}" y="{bar_y + 10}" width="{tl_w * .42}" height="4" rx="2" fill="{c["acc"]}">'
            f'<animate attributeName="width" values="{tl_w * .18};{tl_w * .62};{tl_w * .18}" dur="9s" repeatCount="indefinite" '
            f'calcMode="spline" keyTimes="0;.85;1" keySplines=".45 0 .55 1;.32 .72 0 1"/></rect>')
    pills = ''.join(f'<rect x="{x + w - 30 - i * 40 - 30}" y="{bar_y + 24}" width="30" height="22" rx="11" fill="#ffffff" fill-opacity=".14"/>'
                    for i in range(4))
    labels = ['Auto', 'EN', '1×', '≡']
    pill_txt = ''.join(f'<text x="{x + w - 45 - i * 40}" y="{bar_y + 39}" text-anchor="middle" font-size="10.5" font-weight="700" fill="#ffffff">{t}</text>'
                       for i, t in enumerate(labels))
    up_w, up_h = 190, 64
    ux, uy = x + w - up_w - 16, y + 16
    return f'''
    <clipPath id="vclip"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="18"/></clipPath>
    <g clip-path="url(#vclip)">
      <rect x="{x}" y="{y}" width="{w}" height="{h}" fill="url(#frame)"/>
      <circle cx="{x + w * .3}" cy="{y + h * .45}" r="{h * .5}" fill="{c["blobs"][0]}" opacity=".55" filter="url(#soft)"/>
      <circle cx="{x + w * .75}" cy="{y + h * .7}" r="{h * .45}" fill="{c["blobs"][2]}" opacity=".5" filter="url(#soft)"/>
      <rect x="{x}" y="{bar_y - 6}" width="{w}" height="60" fill="#000000" opacity=".38"/>
      <rect x="{tl_x}" y="{bar_y + 10}" width="{tl_w}" height="4" rx="2" fill="#ffffff" fill-opacity=".25"/>
      {prog}{ticks}
      {play}
      <text x="{x + 54}" y="{bar_y + 39}" font-size="12" font-weight="600" fill="#ffffff" opacity=".9">15:12 / 42:07</text>
      {pills}{pill_txt}
      <rect x="{ux}" y="{uy}" width="{up_w}" height="{up_h}" rx="14" fill="#000000" fill-opacity=".5" stroke="#ffffff" stroke-opacity=".14"/>
      <rect x="{ux + 10}" y="{uy + 10}" width="62" height="44" rx="8" fill="{c["blobs"][1]}"/>
      <text x="{ux + 82}" y="{uy + 27}" font-size="10.5" font-weight="700" fill="{c["acc"]}" letter-spacing=".6">UP NEXT · 5</text>
      <text x="{ux + 82}" y="{uy + 45}" font-size="12.5" font-weight="600" fill="#ffffff">Episode 2</text>
    </g>
    <rect x="{x + .5}" y="{y + .5}" width="{w - 1}" height="{h - 1}" rx="17.5" fill="none" stroke="{c["panel_line"]}" stroke-opacity="{c["panel_line_op"]}"/>''', h


def card(t):
    c = THEMES[t]
    b1, b2, b3 = c['blobs']
    lx = 64

    # левая колонка
    badge_w = 262
    chips, cx, cy = [], lx, 410
    for i, (name, kind) in enumerate(NEW):
        w = 58 + len(name) * 8.6
        if cx + w > 600:
            cx, cy = lx, cy + 58
        chips.append(f'''
      <rect x="{cx}" y="{cy}" width="{w}" height="46" rx="14" fill="{c["card"]}" fill-opacity="{c["card_op"]}" stroke="{c["panel_line"]}" stroke-opacity="{c["panel_line_op"]}"/>
      {icon(kind, c, cx + 12, cy + 9)}
      <text x="{cx + 48}" y="{cy + 28}" font-size="15" font-weight="600" fill="{c["text"]}">{name}</text>''')
        cx += w + 10

    # правая колонка — Parz Video
    px, py, pw, ph = 664, 48, 552, 504
    vx, vy, vw = px + 28, py + 84, pw - 56
    pl, vh = player(c, vx, vy, vw)
    fy = vy + vh + 34
    feats = ''
    for i, f in enumerate(VIDEO):
        col, row = i % 2, i // 2
        fx = vx + col * (vw / 2)
        yy = fy + row * 30
        feats += (f'<path d="M{fx} {yy - 4} l4 4 l8 -9" fill="none" stroke="{c["acc"]}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
                  f'<text x="{fx + 20}" y="{yy}" font-size="14" font-weight="500" fill="{c["sub"]}">{f}</text>')

    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-label="Parz UI {VERSION} pre-release: npm i @carparkteam/parz-ui@next. New: Tabs, Expander, Days, Color Picker, Avatar. Parz Video: big upgrade.">
  <title>Parz UI {VERSION} — pre-release</title>
  <defs>
    <clipPath id="r"><rect width="{W}" height="{H}" rx="28"/></clipPath>
    <filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="70"/></filter>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="40"/></filter>
    <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.3" fill="{c["dots"]}" opacity="{c["dots_op"]}"/></pattern>
    <radialGradient id="fade" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient>
    <mask id="m"><rect width="{W}" height="{H}" fill="url(#fade)"/></mask>
    <linearGradient id="frame" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#14141a"/><stop offset="1" stop-color="#0b0b10"/></linearGradient>
  </defs>
  <g clip-path="url(#r)" font-family="{FONT}">
    <rect width="{W}" height="{H}" fill="{c["bg"]}"/>
    <g filter="url(#blur)" opacity="{c["blob_op"]}">
      <ellipse cx="260" cy="420" rx="240" ry="160" fill="{b1}"/>
      <ellipse cx="980" cy="160" rx="260" ry="170" fill="{b3}"/>
      <ellipse cx="620" cy="80" rx="200" ry="110" fill="{b2}"/>
    </g>
    <rect width="{W}" height="{H}" fill="url(#dots)" mask="url(#m)"/>

    <rect x="{lx}" y="56" width="{badge_w}" height="32" rx="16" fill="{c["acc"]}" fill-opacity=".14" stroke="{c["acc"]}" stroke-opacity=".45"/>
    <circle cx="{lx + 18}" cy="72" r="4" fill="{c["acc"]}"><animate attributeName="opacity" values="1;.3;1" dur="2s" repeatCount="indefinite"/></circle>
    <text x="{lx + 32}" y="77" font-size="13" font-weight="700" letter-spacing="1.2" fill="{c["acc"]}">PRE-RELEASE · {VERSION}</text>

    <text x="{lx - 2}" y="160" font-size="58" font-weight="800" letter-spacing="-2" fill="{c["text"]}">Parz UI <tspan fill="{c["acc"]}">1.2</tspan> beta</text>
    <text x="{lx}" y="200" font-size="18" font-weight="500" fill="{c["sub"]}">Five new components and a big Parz Video upgrade.</text>

    <text x="{lx}" y="256" font-size="12" font-weight="700" letter-spacing="1.4" fill="{c["mut"]}">TRY THE PRE-RELEASE</text>
    <rect x="{lx}" y="270" width="392" height="48" rx="14" fill="{c["code_bg"]}" fill-opacity="{c["code_op"]}" stroke="{c["acc"]}" stroke-opacity=".35"/>
    <text x="{lx + 18}" y="300" font-family="{MONO}" font-size="16" fill="{c["text"]}"><tspan fill="{c["acc"]}">$</tspan> npm i @carparkteam/parz-ui<tspan fill="{c["acc"]}" font-weight="700">@next</tspan></text>
    <text x="{lx}" y="344" font-size="13" fill="{c["mut"]}">Plain <tspan font-family="{MONO}">npm i</tspan> still installs the stable 1.1.0</text>

    <text x="{lx}" y="394" font-size="12" font-weight="700" letter-spacing="1.4" fill="{c["mut"]}">NEW COMPONENTS</text>
    {''.join(chips)}

    <rect x="{px}" y="{py}" width="{pw}" height="{ph}" rx="28" fill="{c["panel"]}" fill-opacity="{c["panel_op"]}" stroke="{c["panel_line"]}" stroke-opacity="{c["panel_line_op"]}"/>
    <text x="{px + 28}" y="{py + 46}" font-size="24" font-weight="800" letter-spacing="-.5" fill="{c["text"]}">Parz Video</text>
    <rect x="{px + 168}" y="{py + 27}" width="118" height="26" rx="13" fill="{c["acc"]}"/>
    <text x="{px + 227}" y="{py + 45}" text-anchor="middle" font-size="12" font-weight="800" letter-spacing=".8" fill="{c["on_acc"]}">BIG UPGRADE</text>
    {pl}
    {feats}
  </g>
  <rect x=".5" y=".5" width="{W - 1}" height="{H - 1}" rx="27.5" fill="none" stroke="{c["line"]}"/>
</svg>
'''


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for t in THEMES:
        p = os.path.join(OUT, f'beta-1.2-{t}.svg')
        open(p, 'w', encoding='utf8', newline='\n').write(card(t))
        print(p, os.path.getsize(p))
