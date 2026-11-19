"""Карточка пробной версии 1.2 для README (.github/beta-1.2-dark.svg и beta-1.2-light.svg).
Сделана по образцу основного баннера (scripts/banner.py): слева логотип, заголовок, список и команда установки,
справа «живая» панель с мини-версиями новых компонентов (Days, Avatar, Ruler).
Запуск из папки parz-ui:  python scripts/banner_beta.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from banner import THEMES, FONT, MONO, OUT, W, H, anim, logo_inner  # noqa: E402

NEW = ['Tabs', 'Expander', 'Days', 'Color Picker', 'Avatar']
NEW2 = ['Number Flow', 'Ruler', 'Pager', 'Title Tabs']


def days(c, a, x0, y0, w):
    """Полоса дней: выбранный день перетекает 14 → 16 → 19 → 14."""
    n, gap = 7, 8
    cw = (w - gap * (n - 1)) / n
    h = 64
    nums = [13, 14, 15, 16, 17, 18, 19]
    names = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
    xs = [x0 + i * (cw + gap) for i in range(n)]
    seq = [(0, 1), (.2, 1), (.3, 3), (.5, 3), (.6, 6), (.8, 6), (.9, 1), (1, 1)]
    fx = [(t, round(xs[i], 1)) for t, i in seq]
    cells = ''.join(
        f'<text x="{xs[i] + cw / 2}" y="{y0 + 25}" text-anchor="middle" font-size="11" font-weight="600" fill="{c["mut"]}">{names[i]}</text>'
        f'<text x="{xs[i] + cw / 2}" y="{y0 + 47}" text-anchor="middle" font-size="17" font-weight="700" fill="{c["text"]}">{nums[i]}</text>'
        for i in range(n))
    dot = f'<circle cx="{xs[4] + cw / 2}" cy="{y0 + 56}" r="2.5" fill="{c["red"]}"/>'
    return f'''
    <text x="{x0}" y="{y0 - 14}" font-size="14" font-weight="700" fill="{c["text"]}">November 2026</text>
    <rect x="{xs[1]}" y="{y0}" width="{cw}" height="{h}" rx="16" fill="{c["acc"]}" fill-opacity=".18" stroke="{c["acc"]}" stroke-opacity=".6">{anim("x", fx, a)}</rect>
    {cells}{dot}'''


def avatars(c, a, x0, y0):
    """Группа аватаров с «+3»; на сайте раздвигаются при наведении — здесь сами."""
    cols = ['#3b6fd8', '#c2410c', '#7c3aed', '#0f766e']
    ini = ['AM', 'KS', 'LT', 'NV']
    r, step, wide = 22, 30, 50
    out = ''
    def frames(i):
        p0, p1 = x0 + r + i * step, x0 + r + i * wide
        return p0, p1, [(0, p0), (.3, p0), (.4, p1), (.65, p1), (.75, p0), (1, p0)]
    for i in range(4):
        p0, p1, cx = frames(i)
        v = p0 if a else p1
        out += (f'<circle cx="{v}" cy="{y0}" r="{r}" fill="{cols[i]}" stroke="{c["bg"]}" stroke-width="3">{anim("cx", cx, a)}</circle>'
                f'<text x="{v}" y="{y0 + 5}" text-anchor="middle" font-size="13" font-weight="700" fill="#ffffff">{anim("x", cx, a)}{ini[i]}</text>')
    p0, p1, mx = frames(4)
    v = p0 if a else p1
    out += (f'<circle cx="{v}" cy="{y0}" r="{r}" fill="{c["off"]}" stroke="{c["bg"]}" stroke-width="3">{anim("cx", mx, a)}</circle>'
            f'<text x="{v}" y="{y0 + 5}" text-anchor="middle" font-size="13" font-weight="700" fill="{c["text"]}">{anim("x", mx, a)}+3</text>')
    out += f'<circle cx="{x0 + r + 15}" cy="{y0 + 15}" r="6" fill="{c["acc"]}" stroke="{c["bg"]}" stroke-width="2.5"/>'
    return out


def color(c, a, x0, y0, w):
    """Полоса оттенка с «жидким» ползунком и кружок выбранного цвета."""
    hues = ['#ff4d4d', '#ffb84d', '#e6ff4d', '#4dff88', '#4de1ff', '#4d6bff', '#c04dff', '#ff4d9e', '#ff4d4d']
    stops = ''.join(f'<stop offset="{i / (len(hues) - 1):.3f}" stop-color="{h}"/>' for i, h in enumerate(hues))
    bw = w - 60
    k = [(0, x0 + bw * .45), (.25, x0 + bw * .45), (.4, x0 + bw * .72), (.6, x0 + bw * .72), (.75, x0 + bw * .2), (.9, x0 + bw * .2), (1, x0 + bw * .45)]
    rx = [(0, 11), (.25, 11), (.32, 15), (.4, 11), (.6, 11), (.67, 15), (.75, 11), (1, 11)]
    fill = [(0, '#4dffc3'), (.25, '#4dffc3'), (.4, '#5a6bff'), (.6, '#5a6bff'), (.75, '#ffd24d'), (.9, '#ffd24d'), (1, '#4dffc3')]
    gid = f'hue{"a" if a else "s"}'
    return f'''
    <linearGradient id="{gid}" x1="0" x2="1">{stops}</linearGradient>
    <rect x="{x0}" y="{y0 - 7}" width="{bw}" height="14" rx="7" fill="url(#{gid})"/>
    <ellipse cx="{x0 + bw * .45}" cy="{y0}" rx="11" ry="11" fill="none" stroke="#ffffff" stroke-width="3.5" filter="url(#sh)">{anim("cx", k, a)}{anim("rx", rx, a)}</ellipse>
    <circle cx="{x0 + w - 20}" cy="{y0}" r="20" fill="#4dffc3">{anim("fill", fill, a)}</circle>'''


def ruler(c, a, x0, y0, w):
    """Шкала Parz Ruler: засечки едут под неподвижным красным указателем, края гаснут."""
    gap, n = 16, int(w / 16) + 8
    cx = x0 + w / 2
    ticks = ''.join(f'<rect x="{x0 - 64 + i * gap - 1}" y="{y0 - 12}" width="2" height="24" rx="1" fill="{c["text"]}" fill-opacity=".45"/>' for i in range(n))
    shift = [(0, 0), (.2, 0), (.38, -48), (.55, -48), (.72, 16), (.85, 16), (1, 0)]
    tr = ('<animateTransform attributeName="transform" type="translate" dur="7s" repeatCount="indefinite" calcMode="spline" '
          f'keyTimes="{";".join(str(t) for t, _ in shift)}" values="{";".join(f"{v} 0" for _, v in shift)}" '
          f'keySplines="{";".join([".32 .72 0 1"] * (len(shift) - 1))}"/>') if a else ''
    gid = f'rf{"a" if a else "s"}'
    return f'''
    <linearGradient id="{gid}" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".3" stop-color="#fff"/><stop offset=".7" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <mask id="m{gid}"><rect x="{x0}" y="{y0 - 20}" width="{w}" height="40" fill="url(#{gid})"/></mask>
    <g mask="url(#m{gid})"><g>{tr}{ticks}</g></g>
    <rect x="{cx - 2}" y="{y0 - 18}" width="4" height="36" rx="2" fill="{c["red"]}"/>'''


def panel(c, a):
    px, py, pw = 690, 56, 530
    x0 = px + 34
    iw = pw - 68
    return f'''
    <rect x="{px}" y="{py}" width="{pw}" height="428" rx="28" fill="{c["panel"]}" fill-opacity="{c["panel_op"]}" stroke="{c["panel_line"]}" stroke-opacity="{c["panel_line_op"]}"/>
    {days(c, a, x0, py + 72, iw)}
    <line x1="{x0}" x2="{x0 + iw}" y1="{py + 172}" y2="{py + 172}" stroke="{c["divider"]}"/>
    {avatars(c, a, x0, py + 236)}
    <line x1="{x0}" x2="{x0 + iw}" y1="{py + 300}" y2="{py + 300}" stroke="{c["divider"]}"/>
    {ruler(c, a, x0, py + 362, iw)}'''


def card(t):
    c = THEMES[t]
    b1, b2, b3 = c['blobs']
    lw = 400
    lh = round(lw * 100 / 296)
    lx, ly = 64, 70

    def comp_line(names):
        out = []
        for i, n in enumerate(names):
            out.append((f'<tspan fill="{c["acc"]}" dx="9">•</tspan><tspan dx="9">{n}</tspan>') if i else f'<tspan>{n}</tspan>')
        return ''.join(out)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-label="Parz UI 1.2 beta: nine new components and a reworked Parz Video. npm i @carparkteam/parz-ui@next">
  <title>Parz UI 1.2 beta</title>
  <style>
    .parz-main,.parz-ui,.parz-credit{{fill:currentColor}}
    .parz-credit{{opacity:.5}}
    .parz-ui{{opacity:.82}}
    .mark-accent{{stroke:{c["acc"]}}}
    .still{{display:none}}
    @media (prefers-reduced-motion: reduce){{ .live{{display:none}} .still{{display:inline}} }}
  </style>
  <defs>
    <clipPath id="r"><rect width="{W}" height="{H}" rx="28"/></clipPath>
    <filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="70"/></filter>
    <filter id="sh" x="-30%" y="-40%" width="160%" height="200%"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="{c["shadow"]}" flood-opacity="{c["shadow_op"]}"/></filter>
    <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.3" fill="{c["dots"]}" opacity="{c["dots_op"]}"/></pattern>
    <radialGradient id="fade" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient>
    <mask id="m"><rect width="{W}" height="{H}" fill="url(#fade)"/></mask>
  </defs>
  <g clip-path="url(#r)" font-family="{FONT}">
    <rect width="{W}" height="{H}" fill="{c["bg"]}"/>
    <g filter="url(#blur)" opacity="{c["blob_op"]}">
      <ellipse cx="320" cy="380" rx="240" ry="160" fill="{b1}"/>
      <ellipse cx="980" cy="160" rx="260" ry="170" fill="{b3}"/>
      <ellipse cx="900" cy="470" rx="220" ry="110" fill="{b2}"/>
    </g>
    <rect width="{W}" height="{H}" fill="url(#dots)" mask="url(#m)"/>

    <svg x="{lx}" y="{ly}" width="{lw}" height="{lh}" viewBox="0 0 296 100" style="color:{c["text"]}">
      {logo_inner()}
    </svg>
    <text x="{lx + lw + 12}" y="{ly + lh * .6}" font-size="28" font-weight="700" letter-spacing="-.5" fill="{c["acc"]}">1.2 beta</text>

    <text x="{lx + 4}" y="272" font-size="38" font-weight="700" letter-spacing="-1" fill="{c["text"]}">Nine new components</text>
    <text x="{lx + 4}" y="316" font-size="38" font-weight="700" letter-spacing="-1" fill="{c["text"]}">and a reworked <tspan fill="{c["acc"]}">Parz Video</tspan></text>
    <text x="{lx + 4}" y="354" font-size="15" font-weight="500" fill="{c["sub"]}">{comp_line(NEW)}</text>
    <text x="{lx + 4}" y="377" font-size="15" font-weight="500" fill="{c["sub"]}">{comp_line(NEW2)}</text>
    <text x="{lx + 4}" y="400" font-size="15" font-weight="500" fill="{c["sub"]}">Video: playlists, auto quality, audio languages, resume</text>
    <rect x="{lx + 4}" y="422" width="330" height="38" rx="12" fill="{c["code_bg"]}" fill-opacity="{c["code_op"]}" stroke="{c["panel_line"]}" stroke-opacity="{c["panel_line_op"]}"/>
    <text x="{lx + 20}" y="446" font-family="{MONO}" font-size="14" fill="{c["text"]}"><tspan fill="{c["acc"]}">$</tspan> npm i @carparkteam/parz-ui@next</text>
    <text x="{lx + 4}" y="488" font-size="13" fill="{c["mut"]}">1.2.0-beta.1 · a regular install still gives you 1.1.0.</text>

    <g class="live">{panel(c, True)}
    </g>
    <g class="still">{panel(c, False)}
    </g>
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
