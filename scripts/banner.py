"""Собирает баннеры README (.github/banner-dark.svg и banner-light.svg) из логотипа Parz UI.
Логотип берётся из private-site/public/brand/parz-ui-light.svg (он нарисован кривыми, без шрифтов).
Запуск из папки parz-ui:  python scripts/banner.py
"""
import os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGO = os.path.join(ROOT, 'private-site', 'public', 'brand', 'parz-ui-light.svg')
OUT = os.path.join(ROOT, '.github')

W, H = 1280, 420
FONT = "Inter, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

THEMES = {
    'dark': dict(bg='#09090b', line='#1f1f23', text='#f4f4f5', sub='#a1a1aa', mut='#71717a', acc='#6ee7a0',
                 dots='#ffffff', dots_op='.05', blobs=['#1f7a52', '#2b3f8f', '#5b2a7a'], blob_op='.55'),
    'light': dict(bg='#f6f7f9', line='#e4e4e7', text='#16161b', sub='#3f3f46', mut='#71717a', acc='#16a067',
                  dots='#000000', dots_op='.06', blobs=['#9de8c4', '#b9c8ff', '#e2c4f2'], blob_op='.7'),
}


def logo_inner():
    s = open(LOGO, encoding='utf8').read()
    inner = s[s.index('</style>') + len('</style>'):s.rindex('</svg>')]
    return inner.strip()


def banner(t):
    c = THEMES[t]
    lw = 600  # ширина логотипа
    lh = round(lw * 100 / 296)
    lx, ly = (W - lw) // 2, 58
    b1, b2, b3 = c['blobs']
    comps = ['Menu', 'Toggle', 'Checkbox', 'Slider', 'Range', 'AnimoLogo']
    # строка компонентов: «Menu · Toggle · …», точки — акцентом
    parts = []
    for i, n in enumerate(comps):
        if i:
            parts.append(f'<tspan fill="{c["acc"]}" dx="10">•</tspan><tspan dx="10">{n}</tspan>')
        else:
            parts.append(f'<tspan>{n}</tspan>')
    comp_line = ''.join(parts)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-label="Parz UI — React components with liquid motion. © 2026 CarPark Team &amp; Dev.CarPark">
  <title>Parz UI — React components with liquid motion</title>
  <style>
    .parz-main,.parz-ui,.parz-credit{{fill:currentColor}}
    .parz-credit{{opacity:.5}}
    .parz-ui{{opacity:.82}}
    .mark-accent{{stroke:{c["acc"]}}}
    @media (prefers-reduced-motion: reduce){{ .blob animateTransform{{display:none}} }}
  </style>
  <defs>
    <clipPath id="r"><rect width="{W}" height="{H}" rx="28"/></clipPath>
    <filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="60"/></filter>
    <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.3" fill="{c["dots"]}" opacity="{c["dots_op"]}"/></pattern>
    <radialGradient id="fade" cx="50%" cy="45%" r="65%"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient>
    <mask id="m"><rect width="{W}" height="{H}" fill="url(#fade)"/></mask>
  </defs>
  <g clip-path="url(#r)">
    <rect width="{W}" height="{H}" fill="{c["bg"]}"/>
    <g filter="url(#blur)" opacity="{c["blob_op"]}">
      <ellipse class="blob" cx="420" cy="170" rx="210" ry="150" fill="{b1}">
        <animateTransform attributeName="transform" type="translate" values="0 0; 60 -20; -30 25; 0 0" dur="18s" repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1;.45 0 .55 1"/>
      </ellipse>
      <ellipse class="blob" cx="880" cy="190" rx="200" ry="140" fill="{b2}">
        <animateTransform attributeName="transform" type="translate" values="0 0; -50 20; 40 -15; 0 0" dur="21s" repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1;.45 0 .55 1"/>
      </ellipse>
      <ellipse class="blob" cx="650" cy="320" rx="180" ry="110" fill="{b3}">
        <animateTransform attributeName="transform" type="translate" values="0 0; 30 -25; -40 10; 0 0" dur="24s" repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1;.45 0 .55 1"/>
      </ellipse>
    </g>
    <rect width="{W}" height="{H}" fill="url(#dots)" mask="url(#m)"/>
    <svg x="{lx}" y="{ly}" width="{lw}" height="{lh}" viewBox="0 0 296 100" style="color:{c["text"]}">
      {logo_inner()}
    </svg>
    <text x="{W // 2}" y="300" text-anchor="middle" font-family="{FONT}" font-size="32" font-weight="600" letter-spacing="-0.5" fill="{c["text"]}">React components with liquid motion</text>
    <text x="{W // 2}" y="342" text-anchor="middle" font-family="{FONT}" font-size="18" font-weight="500" fill="{c["sub"]}">{comp_line}</text>
    <text x="{W // 2}" y="394" text-anchor="middle" font-family="{FONT}" font-size="14" fill="{c["mut"]}">© 2026 CarPark Team &amp; Dev.CarPark</text>
  </g>
  <rect x=".5" y=".5" width="{W - 1}" height="{H - 1}" rx="27.5" fill="none" stroke="{c["line"]}"/>
</svg>
'''


os.makedirs(OUT, exist_ok=True)
for t in THEMES:
    p = os.path.join(OUT, f'banner-{t}.svg')
    open(p, 'w', encoding='utf8', newline='\n').write(banner(t))
    print(p, os.path.getsize(p))
