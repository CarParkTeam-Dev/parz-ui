"""Собирает баннеры README (.github/banner-dark.svg и banner-light.svg).
Слева — логотип, слоган, все компоненты и команда установки; справа — «живая» панель с мини-версиями компонентов,
которые сами двигаются (SMIL). При prefers-reduced-motion показывается такая же панель без движения.
Логотип берётся из private-site/public/brand/parz-ui-light.svg (он нарисован кривыми, без шрифтов) — только читаем.
Запуск из папки parz-ui:  python scripts/banner.py
"""
import math
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGO = os.path.join(ROOT, 'private-site', 'public', 'brand', 'parz-ui-light.svg')
OUT = os.path.join(ROOT, '.github')

W, H = 1280, 540
FONT = "Inter, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace"
EASE = '.32 .72 0 1'   # мягкий выход, как в компонентах
DUR = 8                # длина одного круга анимации, с

THEMES = {
    'dark': dict(bg='#09090b', line='#1f1f23', text='#f4f4f5', sub='#a1a1aa', mut='#71717a', acc='#6ee7a0', on_acc='#04130a',
                 dots='#ffffff', dots_op='.05', blobs=['#1f7a52', '#2b3f8f', '#5b2a7a'], blob_op='.5',
                 panel='#ffffff', panel_op='.035', panel_line='#ffffff', panel_line_op='.08',
                 track='#1c1c21', pill='#ffffff', pill_on='#000000', fg='#9a9aa3', knob='#ffffff', off='#2a2a30',
                 card='#ffffff', card_op='.04', divider='#26262c', red='#ff4d5e', code_bg='#ffffff', code_op='.06', shadow='#000000', shadow_op='.45'),
    'light': dict(bg='#f6f7f9', line='#e4e4e7', text='#16161b', sub='#3f3f46', mut='#71717a', acc='#16a067', on_acc='#ffffff',
                  dots='#000000', dots_op='.06', blobs=['#9de8c4', '#b9c8ff', '#e2c4f2'], blob_op='.65',
                  panel='#ffffff', panel_op='.6', panel_line='#000000', panel_line_op='.07',
                  track='#e6e7ec', pill='#ffffff', pill_on='#111114', fg='#6b6b75', knob='#ffffff', off='#d9dae1',
                  card='#ffffff', card_op='.85', divider='#e2e3ea', red='#ff4d5e', code_bg='#000000', code_op='.05', shadow='#000000', shadow_op='.14'),
}

COMPONENTS = ['Menu', 'Tabs', 'Toggle', 'Checkbox', 'Button', 'Slider', 'Range', 'Expander', 'Progress', 'Badge', 'Video', 'AnimoLogo']


def logo_inner():
    s = open(LOGO, encoding='utf8').read()
    return s[s.index('</style>') + len('</style>'):s.rindex('</svg>')].strip()


def anim(attr, frames, anim_on, extra=''):
    """frames: [(доля круга 0..1, значение)]. Между кадрами — мягкая кривая; при anim_on=False ничего не добавляем."""
    if not anim_on:
        return ''
    kt = ';'.join(f'{t:.4f}' for t, _ in frames)
    vals = ';'.join(str(v) for _, v in frames)
    splines = ';'.join([EASE] * (len(frames) - 1))
    return (f'<animate attributeName="{attr}" dur="{DUR}s" repeatCount="indefinite" keyTimes="{kt}" values="{vals}" '
            f'calcMode="spline" keySplines="{splines}"{extra}/>')


def tabs(c, a, x0, y0):
    """Табы: плашка перетекает Day → Week → Month → Day; ведущий край уходит первым, хвост догоняет.
    Подписи под плашкой — тёмная копия, обрезанная той же плашкой (как в самом компоненте)."""
    labels = [('Day', 64), ('Week', 78), ('Month', 88)]
    pad, h = 4, 36
    xs, x = [], x0 + pad
    for _, w in labels:
        xs.append(x)
        x += w
    tw = x + pad - x0
    # кадры: (время, левый край, правый край)
    L = [(xs[i], xs[i] + labels[i][1]) for i in range(3)]
    seq = [(0, 0), (.12, 0), (.17, 'm01'), (.22, 1), (.42, 1), (.47, 'm12'), (.52, 2), (.72, 2), (.78, 'm20'), (.85, 0), (1, 0)]
    fx, fw = [], []
    for t, k in seq:
        if isinstance(k, int):
            l, r = L[k]
        else:  # середина переезда: ведущий край уже почти там, хвост ещё на месте — капля вытянута
            a_, b_ = int(k[1]), int(k[2])
            if b_ > a_:
                l, r = L[a_][0] + 6, L[b_][1] - 10
            else:
                l, r = L[b_][0] + 10, L[a_][1] - 6
        fx.append((t, round(l, 1)))
        fw.append((t, round(r - l, 1)))
    py = y0 + pad
    pill = f'<rect x="{L[0][0]}" y="{py}" width="{L[0][1] - L[0][0]}" height="{h - pad * 2}" rx="{(h - pad * 2) / 2}">{anim("x", fx, a)}{anim("width", fw, a)}</rect>'
    def txt(fill):
        return ''.join(f'<text x="{xs[i] + w / 2}" y="{y0 + h / 2 + 5}" text-anchor="middle" font-size="14" font-weight="600" fill="{fill}">{n}</text>'
                       for i, (n, w) in enumerate(labels))
    cid = f'tabclip{"a" if a else "s"}'
    return f'''
    <rect x="{x0}" y="{y0}" width="{tw}" height="{h}" rx="{h / 2}" fill="{c["track"]}"/>
    <g fill="{c["pill"]}" filter="url(#sh)">{pill}</g>
    {txt(c["fg"])}
    <clipPath id="{cid}">{pill}</clipPath>
    <g clip-path="url(#{cid})">{txt(c["pill_on"])}</g>
    <circle cx="{xs[1] + 69}" cy="{y0 + 12}" r="4" fill="{c["red"]}"/>'''


def toggle(c, a, x0, y0):
    w, h, p = 56, 32, 3
    k = h - p * 2
    on_x, off_x = x0 + w - p - k / 2, x0 + p + k / 2
    # выкл → (тянется) → вкл → … → выкл
    cx = [(0, off_x), (.2, off_x), (.27, on_x), (.6, on_x), (.67, off_x), (1, off_x)]
    rx = [(0, k / 2), (.2, k / 2), (.235, k / 2 + 7), (.27, k / 2), (.6, k / 2), (.635, k / 2 + 7), (.67, k / 2), (1, k / 2)]
    col = [(0, c['off']), (.2, c['off']), (.25, c['acc']), (.6, c['acc']), (.65, c['off']), (1, c['off'])]
    return f'''
    <rect x="{x0}" y="{y0}" width="{w}" height="{h}" rx="{h / 2}" fill="{c["off"] if not a else c["acc"]}">{anim("fill", col, a)}</rect>
    <ellipse cx="{on_x if not a else off_x}" cy="{y0 + h / 2}" rx="{k / 2}" ry="{k / 2}" fill="{c["knob"]}" filter="url(#sh)">{anim("cx", cx, a)}{anim("rx", rx, a)}</ellipse>
    <text x="{x0 + w + 14}" y="{y0 + h / 2 + 5}" font-size="14" font-weight="500" fill="{c["text"]}">Wi-Fi</text>'''


def slider(c, a, x0, y0, w):
    lo, hi = x0 + .3 * w, x0 + .78 * w
    v = [(0, lo), (.3, lo), (.42, hi), (.7, hi), (.84, lo), (1, lo)]
    vw = [(t, round(x - x0, 1)) for t, x in v]
    r = [(0, 10), (.3, 10), (.36, 13), (.42, 10), (.7, 10), (.77, 13), (.84, 10), (1, 10)]
    return f'''
    <rect x="{x0}" y="{y0 - 3}" width="{w}" height="6" rx="3" fill="{c["off"]}"/>
    <rect x="{x0}" y="{y0 - 3}" width="{round(hi - x0, 1)}" height="6" rx="3" fill="{c["acc"]}">{anim("width", vw, a)}</rect>
    <circle cx="{hi}" cy="{y0}" r="10" fill="{c["knob"]}" filter="url(#sh)">{anim("cx", v, a)}{anim("r", r, a)}</circle>'''


def ring(c, a, cx, cy):
    r = 20
    circ = 2 * math.pi * r
    off = [(0, circ), (.1, circ * .72), (.35, circ * .38), (.6, circ * .12), (.7, 0), (.88, 0), (.96, circ), (1, circ)]
    return f'''
    <circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{c["off"]}" stroke-width="5"/>
    <circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{c["acc"]}" stroke-width="5" stroke-linecap="round"
      stroke-dasharray="{circ:.2f}" stroke-dashoffset="{0 if not a else circ:.2f}" transform="rotate(-90 {cx} {cy})">{anim("stroke-dashoffset", [(t, round(v, 2)) for t, v in off], a)}</circle>'''


def expander(c, a, x0, y0, w):
    """Карточка-экспандер: вторая секция плавно раскрывается, стрелка поворачивается."""
    row = 44
    body = 30
    hgt = [(0, 0), (.35, 0), (.45, body), (.8, body), (.9, 0), (1, 0)]
    rot = [(0, 0), (.35, 0), (.45, 180), (.8, 180), (.9, 0), (1, 0)]
    ty = [(t, round(y0 + row * 2 + v, 1)) for t, v in hgt]
    def chev(x, y, deg, animated):
        rt = ''
        if animated and a:
            rt = (f'<animateTransform attributeName="transform" type="rotate" dur="{DUR}s" repeatCount="indefinite" '
                  f'keyTimes="{";".join(f"{t:.4f}" for t, _ in rot)}" values="{";".join(f"{v} {x} {y}" for _, v in rot)}" '
                  f'calcMode="spline" keySplines="{";".join([EASE] * (len(rot) - 1))}"/>')
        return (f'<g transform="rotate({deg} {x} {y})"><path d="M{x - 5} {y - 2.5} L{x} {y + 2.5} L{x + 5} {y - 2.5}" fill="none" '
                f'stroke="{c["fg"]}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>{rt}</g>')
    total = [(t, round(row * 3 + v + 4, 1)) for t, v in hgt]
    open_h = 0 if a else body
    return f'''
    <rect x="{x0}" y="{y0}" width="{w}" height="{row * 3 + open_h + 4}" rx="16" fill="{c["card"]}" fill-opacity="{c["card_op"]}" stroke="{c["panel_line"]}" stroke-opacity="{c["panel_line_op"]}">{anim("height", total, a)}</rect>
    <text x="{x0 + 18}" y="{y0 + 27}" font-size="14" font-weight="700" fill="{c["text"]}">Delivery</text>
    {chev(x0 + w - 22, y0 + 23, 0, False)}
    <line x1="{x0 + 18}" x2="{x0 + w - 18}" y1="{y0 + row}" y2="{y0 + row}" stroke="{c["divider"]}"/>
    <text x="{x0 + 18}" y="{y0 + row + 27}" font-size="14" font-weight="700" fill="{c["text"]}">Notifications</text>
    {chev(x0 + w - 22, y0 + row + 23, 0 if a else 180, True)}
    <svg x="{x0}" y="{y0 + row * 2 - 6}" width="{w}" height="{open_h}" overflow="hidden">{anim("height", hgt, a)}
      <rect x="18" y="4" width="34" height="20" rx="10" fill="{c["acc"]}"/><circle cx="42" cy="14" r="7.5" fill="{c["knob"]}"/>
      <text x="62" y="19" font-size="13" fill="{c["sub"]}">Push and sound</text>
    </svg>
    <line x1="{x0 + 18}" x2="{x0 + w - 18}" y1="{y0 + row * 2 + open_h}" y2="{y0 + row * 2 + open_h}" stroke="{c["divider"]}">{anim("y1", ty, a)}{anim("y2", ty, a)}</line>
    <text x="{x0 + 18}" y="{y0 + row * 2 + open_h + 27}" font-size="14" font-weight="700" fill="{c["text"]}">{anim("y", [(t, round(v + 27, 1)) for t, v in ty], a)}Returns</text>'''


def buttons(c, a, x0, y0):
    """Кнопка с каплей от касания и кнопка-колокольчик с бейджем-счётчиком."""
    ripple_r = [(0, 0), (.55, 0), (.62, 0), (.75, 90), (1, 90)]
    ripple_o = [(0, 0), (.55, 0), (.62, .35), (.75, 0), (1, 0)]
    pulse_r = [(0, 9), (.5, 9), (.62, 17), (.7, 17), (1, 9)]
    pulse_o = [(0, 0), (.5, 0), (.52, .5), (.7, 0), (1, 0)]
    bx = x0 + 168
    return f'''
    <clipPath id="btnclip{"a" if a else "s"}"><rect x="{x0}" y="{y0}" width="150" height="42" rx="21"/></clipPath>
    <rect x="{x0}" y="{y0}" width="150" height="42" rx="21" fill="{c["acc"]}"/>
    <g clip-path="url(#btnclip{"a" if a else "s"})"><circle cx="{x0 + 52}" cy="{y0 + 21}" r="0" fill="#ffffff" opacity="0">{anim("r", ripple_r, a)}{anim("opacity", ripple_o, a)}</circle></g>
    <text x="{x0 + 66}" y="{y0 + 26}" text-anchor="middle" font-size="14" font-weight="600" fill="{c["on_acc"]}">Get started</text>
    <path d="M{x0 + 124} {y0 + 21} h10 m-4 -4 l4 4 l-4 4" fill="none" stroke="{c["on_acc"]}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="{bx + 21}" cy="{y0 + 21}" r="21" fill="{c["card"]}" fill-opacity="{c["card_op"]}" stroke="{c["panel_line"]}" stroke-opacity="{c["panel_line_op"]}"/>
    <path d="M{bx + 15} {y0 + 25} v-5 a6 6 0 0 1 12 0 v5 l1.5 2 h-15 z M{bx + 19} {y0 + 29} a2 2 0 0 0 4 0" fill="none" stroke="{c["text"]}" stroke-width="1.6" stroke-linejoin="round"/>
    <circle cx="{bx + 35}" cy="{y0 + 6}" r="9" fill="{c["red"]}" opacity="0">{anim("r", pulse_r, a)}{anim("opacity", pulse_o, a)}</circle>
    <circle cx="{bx + 35}" cy="{y0 + 6}" r="9" fill="{c["red"]}"/>
    <text x="{bx + 35}" y="{y0 + 10}" text-anchor="middle" font-size="11" font-weight="700" fill="#ffffff">3</text>'''


def panel(c, a):
    px, py, pw = 690, 56, 530
    x0 = px + 34
    return f'''
    <rect x="{px}" y="{py}" width="{pw}" height="428" rx="28" fill="{c["panel"]}" fill-opacity="{c["panel_op"]}" stroke="{c["panel_line"]}" stroke-opacity="{c["panel_line_op"]}"/>
    {tabs(c, a, x0, py + 34)}
    {ring(c, a, px + pw - 58, py + 52)}
    {toggle(c, a, x0, py + 98)}
    {slider(c, a, x0 + 150, py + 114, pw - 150 - 68)}
    {expander(c, a, x0, py + 160, pw - 68)}
    {buttons(c, a, x0, py + 354)}'''


def banner(t):
    c = THEMES[t]
    b1, b2, b3 = c['blobs']
    lw = 470
    lh = round(lw * 100 / 296)
    lx, ly = 64, 96
    comp_rows = [COMPONENTS[:6], COMPONENTS[6:]]
    def comp_line(names):
        out = []
        for i, n in enumerate(names):
            out.append((f'<tspan fill="{c["acc"]}" dx="9">•</tspan><tspan dx="9">{n}</tspan>') if i else f'<tspan>{n}</tspan>')
        return ''.join(out)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-label="Parz UI — React components with liquid motion. © 2026 CarPark Team &amp; Dev.CarPark">
  <title>Parz UI — React components with liquid motion</title>
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
      <ellipse cx="300" cy="200" rx="240" ry="170" fill="{b1}">
        <animateTransform attributeName="transform" type="translate" values="0 0; 60 -20; -30 25; 0 0" dur="18s" repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1;.45 0 .55 1"/>
      </ellipse>
      <ellipse cx="960" cy="220" rx="260" ry="170" fill="{b2}">
        <animateTransform attributeName="transform" type="translate" values="0 0; -50 20; 40 -15; 0 0" dur="21s" repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1;.45 0 .55 1"/>
      </ellipse>
      <ellipse cx="640" cy="470" rx="220" ry="120" fill="{b3}">
        <animateTransform attributeName="transform" type="translate" values="0 0; 30 -25; -40 10; 0 0" dur="24s" repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1;.45 0 .55 1"/>
      </ellipse>
    </g>
    <rect width="{W}" height="{H}" fill="url(#dots)" mask="url(#m)"/>

    <svg x="{lx}" y="{ly}" width="{lw}" height="{lh}" viewBox="0 0 296 100" style="color:{c["text"]}">
      {logo_inner()}
    </svg>
    <text x="{lx + 4}" y="318" font-size="38" font-weight="700" letter-spacing="-1" fill="{c["text"]}">React components</text>
    <text x="{lx + 4}" y="362" font-size="38" font-weight="700" letter-spacing="-1" fill="{c["text"]}">with <tspan fill="{c["acc"]}">liquid motion</tspan></text>
    <text x="{lx + 4}" y="404" font-size="15" font-weight="500" fill="{c["sub"]}">{comp_line(comp_rows[0])}</text>
    <text x="{lx + 4}" y="428" font-size="15" font-weight="500" fill="{c["sub"]}">{comp_line(comp_rows[1])}</text>
    <rect x="{lx + 4}" y="448" width="270" height="38" rx="12" fill="{c["code_bg"]}" fill-opacity="{c["code_op"]}" stroke="{c["panel_line"]}" stroke-opacity="{c["panel_line_op"]}"/>
    <text x="{lx + 20}" y="472" font-family="{MONO}" font-size="14" fill="{c["text"]}"><tspan fill="{c["acc"]}">$</tspan> npm i @carparkteam/parz-ui</text>
    <text x="{W - 60}" y="{H - 22}" text-anchor="end" font-size="12" fill="{c["mut"]}">© 2026 CarPark Team &amp; Dev.CarPark</text>

    <g class="live">{panel(c, True)}
    </g>
    <g class="still">{panel(c, False)}
    </g>
  </g>
  <rect x=".5" y=".5" width="{W - 1}" height="{H - 1}" rx="27.5" fill="none" stroke="{c["line"]}"/>
</svg>
'''


os.makedirs(OUT, exist_ok=True)
for t in THEMES:
    p = os.path.join(OUT, f'banner-{t}.svg')
    open(p, 'w', encoding='utf8', newline='\n').write(banner(t))
    print(p, os.path.getsize(p))
