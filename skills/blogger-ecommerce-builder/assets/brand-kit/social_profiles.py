"""Kreislo social media profiles and headers: one Inkscape project per platform image (YouTube, LinkedIn,
Facebook, TikTok, Instagram, X, WhatsApp Business). Each folder: PROJECT (Inkscape).svg, the ready-to-upload PNG
at the platform's size, a SAFE AREAS check image for headers, and a READ ME.
Run: python3 -I social_profiles.py <fonts dir> <out dir>   (needs design_templates.py / design.py and kreislo.py)"""
import os, sys, json, re
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
try:
    import design as D
except ImportError:
    import design_templates as D
K = D.K
T, logo, symbol, rrect, layer, doc, check, chat_icon, pill, width, esc = (D.T, D.logo, D.symbol, D.rrect, D.layer, D.doc,
                                                                      D.check, D.chat_icon, D.pill, D.width, D.esc)
INK, ORANGE, WHITE, GREY, PAPER, SOFT = D.INK, D.ORANGE, D.WHITE, D.GREY, D.PAPER, D.SOFT
CONTACT = D.CONTACT
OUT = sys.argv[2]
ROOT = os.path.join(OUT, 'Kreislo Design Templates', 'E - Social media profiles and headers')
TMP = os.path.join(OUT, '_tmp'); os.makedirs(TMP, exist_ok=True)
SERV1 = 'Second-hand appliances, tools and machines'
SERV2 = 'Digital products  ·  Fulfilment in Gießen  ·  Germany to Kenya'

def bg(W, H, ring_at=None, ring_d=None, ring_op=0.08, grad=True):
    g = (f'<defs><radialGradient id="bgg" cx="0.3" cy="0.35" r="0.95"><stop offset="0" stop-color="#262626"/>'
         f'<stop offset="1" stop-color="{INK}"/></radialGradient></defs><rect width="{W}" height="{H}" fill="url(#bgg)"/>') if grad \
        else f'<rect width="{W}" height="{H}" fill="{INK}"/>'
    if ring_at:
        d = ring_d; sw = d * 0.16
        g += f'<g opacity="{ring_op}">{K.ring(ring_at[0], ring_at[1], d, d, sw, WHITE, gap=K.RING_GAP, head=K.RING_HEAD)}</g>'
    return g

def guide_layer(W, H, boxes, note=''):
    """Hidden layer with labelled dashed boxes: what each device shows. Switch it on to check, off to export."""
    sw = max(2.0, max(W, H) / 700); fs = max(14, max(W, H) / 70)
    g = ''
    for (x, y, w, h, col, lab) in boxes:
        g += (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="none" stroke="{col}" stroke-width="{sw:.1f}" '
              f'stroke-dasharray="{sw*5:.1f} {sw*3:.1f}"/>')
        if lab:
            g += T(x + sw * 4, y + fs * 1.15, lab, fs, 'Open Sans', 700, col)
    if note:
        g += T(W / 2, H - fs * 0.8, note, fs * 0.9, 'Open Sans', 700, '#00A3FF', 'middle')
    return layer('0 · SAFE AREAS (switch on to check, off before exporting)', g, locked=True, hidden=True, lid='layer-guides')

def circle_guide(W):
    sw = max(2, W / 250)
    return layer('0 · SAFE AREAS (switch on to check, off before exporting)',
                 f'<circle cx="{W/2}" cy="{W/2}" r="{W/2 - sw/2}" fill="none" stroke="#00A3FF" stroke-width="{sw}" stroke-dasharray="{sw*5} {sw*3}"/>'
                 + T(W / 2, W - W * 0.04, 'Shown as a circle: keep everything inside', W * 0.035, 'Open Sans', 700, '#00A3FF', 'middle'),
                 locked=True, hidden=True, lid='layer-guides')

def services(x, y, size, anchor='start', fill=GREY, gap=1.5):
    return (T(x, y, SERV1, size, 'Open Sans', 600, WHITE, anchor, label='Services line 1')
            + T(x, y + size * gap, SERV2, size, 'Open Sans', 400, fill, anchor, label='Services line 2'))

def tagline_live(x, y, size, anchor='start', fill=GREY):
    return T(x, y, 'KEEP GOOD THINGS MOVING', size, 'Open Sans', 600, fill, anchor, ls=size * 0.32, label='Tagline')

# ---------- profile pictures (logo) ----------
def profile_symbol(W, bgc=INK, ringc=ORANGE, k=WHITE, frac=0.6):
    body = f'<rect width="{W}" height="{W}" fill="{bgc}"/>' + symbol(W / 2, W / 2, W * frac, ringc, k)
    return [layer('1 · LOGO (locked)', body, locked=True), circle_guide(W)]

def photo_ring(W):
    """Personal profile photo with the Kreislo arrow ring around the face."""
    cx = cy = W / 2
    ph = (f'<rect inkscape:label="Placeholder (delete)" width="{W}" height="{W}" fill="#3A3A3A"/>'
          f'<circle inkscape:label="Placeholder (delete)" cx="{cx}" cy="{W*0.40}" r="{W*0.17}" fill="#777"/>'
          f'<path inkscape:label="Placeholder (delete)" d="M{W*0.18} {W}C{W*0.2} {W*0.7} {W*0.34} {W*0.62} {cx} {W*0.62}S{W*0.8} {W*0.7} {W*0.82} {W}Z" fill="#777"/>'
          + T(cx, W * 0.78, 'PUT YOUR PHOTO HERE', W * 0.035, 'Oswald', 500, '#BBBBBB', 'middle', ls=3))
    d = W * 0.84; sw = W * 0.04
    ring = K.ring(cx, cy, d, d, sw, ORANGE, gap=K.RING_GAP, head=(1.15, 1.35))
    return [layer('1 · PHOTO – put your photo here (face in the middle)', ph),
            layer('2 · ORANGE RING (locked)', ring, locked=True), circle_guide(W)]

# ---------- icons for highlight covers ----------
def icon(kind, cx, cy, s, c=WHITE, a=ORANGE):
    k = s / 400.0; sw = 18
    st = f'fill="none" stroke="{c}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"'
    sa = f'fill="none" stroke="{a}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"'
    g = {
        'shop': f'<path d="M80 140H320L300 360H100Z" {st}/><path d="M140 140V110a60 60 0 0 1 120 0V140" {sa}/>',
        'delivery': f'<path d="M40 110H250V290H40Z" {st}/><path d="M250 170H320L360 220V290H250" {st}/><circle cx="110" cy="300" r="34" fill="#1E1E1E" stroke="{a}" stroke-width="{sw}"/><circle cx="300" cy="300" r="34" fill="#1E1E1E" stroke="{a}" stroke-width="{sw}"/>',
        'kenya': f'<circle cx="200" cy="200" r="150" {st}/><path d="M50 200H350M200 50C130 120 130 280 200 350M200 50C270 120 270 280 200 350" {st}/><circle cx="250" cy="230" r="20" fill="{a}"/>',
        'reviews': f'<path d="M200 50L244 150L352 158L270 228L296 334L200 276L104 334L130 228L48 158L156 150Z" {sa}/>',
        'fulfilment': f'<path d="M200 50L340 120V280L200 350L60 280V120Z" {st}/><path d="M60 120L200 190L340 120M200 190V350" {st}/><path d="M130 85L270 155" {sa}/>',
        'faq': f'<path d="M70 70H330Q350 70 350 90V260Q350 280 330 280H170L100 340V280H70Q50 280 50 260V90Q50 70 70 70Z" {st}/><path d="M165 140q0-40 35-40t35 35q0 25-35 40v20" {sa}/><circle cx="200" cy="232" r="11" fill="{a}"/>',
    }[kind]
    return f'<g inkscape:label="Icon" transform="translate({cx - 200*k:.1f},{cy - 200*k:.1f}) scale({k:.4f})">{g}</g>'

def build():
    jobs = []
    def add(folder, base, title, W, H, layers, readme, extra=None, crop=True):
        d = os.path.join(ROOT, folder); os.makedirs(d, exist_ok=True)
        svg = doc(W, H, (f'{W/300:.4f}in', f'{H/300:.4f}in'), layers, title, f'Kreislo - {base}.png')
        sp = os.path.join(d, f'Kreislo - {base} - PROJECT (Inkscape).svg')
        open(sp, 'w', encoding='utf-8').write(svg)
        open(os.path.join(d, 'READ ME.txt'), 'w', encoding='utf-8').write(readme.strip() + '\n')
        jobs.append(dict(svg=sp, out=os.path.join(d, f'Kreislo - {base} - UPLOAD THIS {W}x{H}.png'), w=W, h=H, scale=1))
        for e in (extra or []):
            jobs.append(dict(svg=sp, out=os.path.join(d, e[0]), w=W, h=H, scale=e[1] / W))
        if crop:   # same design with the safe-area layer switched on, for checking only
            cp = os.path.join(TMP, re.sub(r'[^A-Za-z0-9]+', '_', base) + '.svg')
            open(cp, 'w', encoding='utf-8').write(svg.replace('inkscape:label="0 · SAFE AREAS (switch on to check, off before exporting)" sodipodi:insensitive="true" style="display:none"',
                                                              'inkscape:label="0 · SAFE AREAS" sodipodi:insensitive="true"'))
            jobs.append(dict(svg=cp, out=os.path.join(d, f'Kreislo - {base} - SAFE AREAS check (do not upload).png'), w=W, h=H, scale=min(W, 1600) / W))

    HOW = """
How to change it in Inkscape: install the fonts Oswald and Open Sans (folder D), open the PROJECT (Inkscape).svg,
double-click a text to edit it. Layer "0 · SAFE AREAS" (Layer > Layers and Objects, eye icon) shows what each
device keeps: switch it on while you work, off before exporting. Export: Shift+Ctrl+E > Page > Export
(the file already exports at the right pixel size).
"""
    n = 0
    def nxt():
        nonlocal n; n += 1; return f'E{n:02d}'

    # ===== YouTube =====
    W, H = 2560, 1440; sx, sy, sw_, sh = (W - 1546) / 2, (H - 423) / 2, 1546, 423
    deco = bg(W, H, ring_at=(2150, 380), ring_d=1300, ring_op=0.07)
    deco += symbol(300, 1180, 260, ORANGE, WHITE, 'Symbol (only on TV and big screens)')
    deco += f'<rect x="0" y="{H-14}" width="{W}" height="14" fill="{ORANGE}"/>'
    lg, lw = logo(sx + 30, sy + 100, 142, WHITE, ORANGE)
    deco += lg + K.tagline(sx + 30, sy + 100 + 142 + 70, lw, GREY, cap=24)
    deco += f'<rect x="{sx + 30 + lw + 56}" y="{sy + 60}" width="5" height="{sh - 120}" fill="{ORANGE}"/>'
    rx = sx + 30 + lw + 100
    txt = T(rx, sy + 138, 'NEW VIDEOS EVERY WEEK', 54, 'Oswald', 600, ORANGE, ls=2, label='Headline (change it)')
    txt += T(rx, sy + 214, 'Second-hand appliances, tools', 40, 'Open Sans', 600, WHITE, label='Line 1')
    txt += T(rx, sy + 270, 'and machines · digital products', 40, 'Open Sans', 600, WHITE, label='Line 2')
    txt += T(rx, sy + 340, 'Gießen, Germany · shipping to Kenya', 32, 'Open Sans', 400, GREY, label='Line 3')
    L = [layer('1 · BACKGROUND AND LOGO (locked)', deco, locked=True), layer('2 · TEXT – double-click to edit', txt)]
    L.append(guide_layer(W, H, [(sx, sy, sw_, sh, '#00A3FF', 'PHONE + ALL DEVICES 1546 x 423 (logo and text inside here)'),
                               ((W - 2560) / 2, sy, 2560, sh, '#FF00AA', 'COMPUTER 2560 x 423'), (0, 0, W, H, '#22BB55', 'TV 2560 x 1440')],
                        'Only the middle strip shows on phones. Everything outside is decoration.'))
    add(f'{nxt()} YouTube - channel banner (header)', 'YouTube - channel banner (header)', 'Kreislo YouTube channel banner', W, H, L,
        f"""Kreislo - YouTube - channel banner (header image)
For: the wide image at the top of the YouTube channel.
Upload: YouTube Studio > Customisation > Branding > Banner image > Change. File: "UPLOAD THIS 2560x1440.png".
Size: 2560 x 1440 px. Phones show only the middle 1546 x 423 px, computers a wider strip, TVs everything.
The logo and all text sit inside the middle strip; the big ring and the symbol on the left are only extras for TVs.
Open "SAFE AREAS check" to see the three crops. Change "NEW VIDEOS EVERY WEEK" to your real rhythm.
{HOW}""")
    W = 800; L = profile_symbol(W)
    add(f'{nxt()} YouTube - profile picture', 'YouTube - profile picture', 'Kreislo YouTube profile picture', W, W, L,
        f"""Kreislo - YouTube - profile picture (channel icon)
Upload: YouTube Studio > Customisation > Branding > Picture > Change. File: "UPLOAD THIS 800x800.png".
YouTube shows it as a circle (98 x 98 px on computers): the symbol stays well inside the circle.
{HOW}""", crop=False)
    W, H = 1280, 720
    ph = D.photo_placeholder(560, 0, 720, 720, 0, None, 'PUT A FRAME FROM THE VIDEO HERE')
    win = (560, 0, 720, 720, 1)
    frame = f'<path inkscape:label="Background with picture window" d="M0 0H{W}V{H}H0Z M560 0H1280V720H560Z" fill="{INK}" fill-rule="evenodd"/>'
    deco = f'<rect x="556" y="0" width="10" height="{H}" fill="{ORANGE}"/>'
    lg, _ = logo(48, 46, 40, WHITE, ORANGE); deco += lg
    b, _ = pill(48, 520, '189 €', 46, h=84, pad=30); deco += b
    txt = (T(48, 230, 'WASHING', 104, label='Title line 1') + T(48, 340, 'MACHINE', 104, label='Title line 2')
           + T(48, 450, 'TESTED', 104, 'Oswald', 600, ORANGE, label='Title line 3'))
    L = [layer('1 · PICTURE – a frame from your video or a photo', ph), layer('2 · BACKGROUND (locked)', frame, locked=True),
         layer('3 · LOGO AND PRICE', deco), layer('4 · TEXT – double-click to edit', txt),
         guide_layer(W, H, [(1080, 640, 190, 70, '#FF00AA', 'video length'), (0, 0, W, H, '#00A3FF', '')], 'Bottom right: YouTube puts the video length there')]
    add(f'{nxt()} YouTube - video thumbnail', 'YouTube - video thumbnail', 'Kreislo YouTube thumbnail', W, H, L,
        f"""Kreislo - YouTube - video thumbnail (template)
The picture people see before they click a video. Upload it when you publish: Details > Thumbnail > Upload file.
Size: 1280 x 720 px (under 2 MB). Three short words in big letters work best; the price chip is optional.
Put a sharp frame from the video (or a photo) in layer "1 · PICTURE" and scale it to fill the right side.
Keep the bottom-right corner clear: YouTube shows the video length there.
{HOW}""")
    W = 150
    body = symbol(75, 75, 132, ORANGE, WHITE)
    L = [layer('1 · SYMBOL (locked)', body, locked=True), circle_guide(W)]
    add(f'{nxt()} YouTube - video watermark', 'YouTube - video watermark', 'Kreislo YouTube watermark', W, W, L,
        f"""Kreislo - YouTube - video watermark (branding on every video)
The small logo in the bottom-right corner of all your videos; viewers can click it to subscribe.
Upload: YouTube Studio > Customisation > Branding > Video watermark > Upload. File: "UPLOAD THIS 150x150.png"
(transparent background). Choose "Entire video".
{HOW}""", crop=False)

    # ===== LinkedIn =====
    W, H = 1128, 191
    deco = bg(W, H, ring_at=(980, 95), ring_d=420, ring_op=0.08)
    deco += f'<rect x="0" y="{H-6}" width="{W}" height="6" fill="{ORANGE}"/>'
    txt = (T(W - 48, 86, 'KEEP GOOD THINGS MOVING', 44, 'Oswald', 600, WHITE, 'end', label='Headline')
           + T(W - 48, 130, SERV1 + ' · digital products', 18, 'Open Sans', 600, GREY, 'end', label='Line 1')
           + T(W - 48, 158, 'Fulfilment in Gießen · shipping from Germany to Kenya', 18, 'Open Sans', 400, GREY, 'end', label='Line 2'))
    L = [layer('1 · BACKGROUND (locked)', deco, locked=True), layer('2 · TEXT – double-click to edit', txt),
         guide_layer(W, H, [(0, 60, 230, 131, '#FF00AA', 'logo'), (300, 20, 790, 150, '#00A3FF', 'text area')],
                     'Bottom left is covered by the company logo')]
    add(f'{nxt()} LinkedIn - company page cover (header)', 'LinkedIn - company page cover (header)', 'Kreislo LinkedIn company cover', W, H, L,
        f"""Kreislo - LinkedIn - company page cover (header image of the Kreislo company page)
Upload: your LinkedIn company page > Edit page > Header > Cover image. File: "UPLOAD THIS 1128x191.png"
(also given twice as big, 2256x382, if you prefer the sharper one; same proportions).
The company logo sits over the bottom left, so the text is on the right.
LinkedIn changes this size from time to time: if the upload screen asks for another size, change
File > Document Properties and move the text, or tell me and I will remake it.
{HOW}""", extra=[('Kreislo - LinkedIn - company page cover (header) - 2x 2256x382.png', 2256, 382)])
    W = 400; L = profile_symbol(W, frac=0.66)
    add(f'{nxt()} LinkedIn - company page logo (profile)', 'LinkedIn - company page logo (profile)', 'Kreislo LinkedIn company logo', W, W, L,
        f"""Kreislo - LinkedIn - company page logo (the profile picture of the Kreislo company page)
Upload: company page > Edit page > Header > Logo. File: "UPLOAD THIS 400x400.png" (also 800x800 for sharper screens).
LinkedIn shows company logos as a square; it works as a circle too.
{HOW}""", extra=[('Kreislo - LinkedIn - company page logo (profile) - 800x800.png', 800, 800)], crop=False)
    W, H = 1584, 396
    deco = bg(W, H, ring_at=(1420, 200), ring_d=760, ring_op=0.07)
    deco += f'<rect x="0" y="{H-8}" width="{W}" height="8" fill="{ORANGE}"/>'
    lg, lw = logo(W - 64, 74, 70, WHITE, ORANGE, anchor='end'); deco += lg
    txt = (tagline_live(W - 64, 196, 20, 'end')
           + T(W - 64, 262, SERV1, 26, 'Open Sans', 600, WHITE, 'end', label='Line 1')
           + T(W - 64, 302, SERV2, 24, 'Open Sans', 400, GREY, 'end', label='Line 2')
           + T(W - 64, 350, CONTACT['web'] + '  ·  WhatsApp ' + CONTACT['phone'], 22, 'Open Sans', 600, ORANGE, 'end', label='Contact'))
    L = [layer('1 · BACKGROUND AND LOGO (locked)', deco, locked=True), layer('2 · TEXT – double-click to edit', txt),
         guide_layer(W, H, [(30, 180, 420, 216, '#FF00AA', 'your photo (computer)'), (0, 230, 640, 166, '#FFAA00', ''), (620, 40, 920, 330, '#00A3FF', 'text area')],
                     'Left side is covered by your profile photo')]
    add(f'{nxt()} LinkedIn - personal profile background (header)', 'LinkedIn - personal profile background (header)', 'Kreislo LinkedIn personal background', W, H, L,
        f"""Kreislo - LinkedIn - personal profile background (the header image on YOUR own LinkedIn profile)
Upload: your profile > the pencil on the top image > Change photo. File: "UPLOAD THIS 1584x396.png".
Your round profile photo covers the bottom left (more of it on phones), so logo and text are on the right.
{HOW}""")
    W = 800; L = photo_ring(W)
    add(f'{nxt()} LinkedIn - personal profile photo with ring', 'LinkedIn - personal profile photo with ring', 'Kreislo LinkedIn profile photo frame', W, W, L,
        f"""Kreislo - LinkedIn - personal profile photo (YOUR photo with the orange Kreislo ring)
For your own profile photo on LinkedIn (also works on Facebook, X and WhatsApp for your personal account).
How: open the PROJECT, File > Import your portrait, move it to layer "1 · PHOTO" (Layer > Move Selection to Layer),
delete the grey placeholder, scale the photo so your face is in the middle of the ring. Export, then upload:
profile > your photo > Edit > Change photo. File size: 800 x 800 px (LinkedIn recommends at least 400 x 400).
Use a clear, friendly, recent photo with your face filling about half of the circle.
{HOW}""", crop=False)

    # ===== Facebook =====
    W, H = 1640, 924; band = (0, (H - 624) / 2, W, 624)
    deco = bg(W, H, ring_at=(1440, 300), ring_d=900, ring_op=0.07)
    deco += f'<rect x="0" y="{H-10}" width="{W}" height="10" fill="{ORANGE}"/>'
    lg, lw = logo(W / 2, 300, 120, WHITE, ORANGE, anchor='middle'); deco += lg
    deco += K.tagline(W / 2 - lw / 2, 300 + 120 + 58, lw, GREY, cap=19)
    btn_w = 620; bx = W / 2 - btn_w / 2; by = 600
    deco += f'<path inkscape:label="Button" d="{rrect(bx, by, btn_w, 76, 38)}" fill="{ORANGE}"/>' + chat_icon(bx + 28, by + 16, 44)
    txt = (T(W / 2, 560, SERV1 + '  ·  Digital products  ·  Fulfilment in Gießen', 28, 'Open Sans', 600, WHITE, 'middle', label='Services')
           + T(bx + 92, by + 50, 'ORDER ON WHATSAPP  ' + CONTACT['phone'], 30, 'Oswald', 500, WHITE, label='Button text'))
    L = [layer('1 · BACKGROUND AND LOGO (locked)', deco, locked=True), layer('2 · TEXT – double-click to edit', txt),
         guide_layer(W, H, [(0, band[1], W, 624, '#00A3FF', 'COMPUTER shows this band 1640 x 624'), (0, 0, W, H, '#22BB55', 'PHONE shows all (16:9)')],
                     'Logo, text and button stay inside the blue band')]
    add(f'{nxt()} Facebook - page cover (header)', 'Facebook - page cover (header)', 'Kreislo Facebook page cover', W, H, L,
        f"""Kreislo - Facebook - page cover (the header image of the Kreislo Facebook page)
Upload: your Facebook page > Edit cover photo > Upload photo. File: "UPLOAD THIS 1640x924.png".
Phones show the whole picture (16:9); computers cut off the top and bottom and show the middle band. All text,
the logo and the button are inside that band, so nothing is cut on any device. Drag it into place if Facebook asks.
Also fine as the cover of your personal Facebook profile or a Facebook group.
{HOW}""")
    W = 720; L = profile_symbol(W)
    add(f'{nxt()} Facebook - profile picture', 'Facebook - profile picture', 'Kreislo Facebook profile picture', W, W, L,
        f"""Kreislo - Facebook - profile picture (of the Kreislo Facebook page)
Upload: page > profile picture > Update profile picture. File: "UPLOAD THIS 720x720.png".
Facebook shows it as a circle; the symbol stays inside.
{HOW}""", crop=False)

    # ===== TikTok =====
    W = 800; L = profile_symbol(W)
    add(f'{nxt()} TikTok - profile picture', 'TikTok - profile picture', 'Kreislo TikTok profile picture', W, W, L,
        f"""Kreislo - TikTok - profile picture
Upload: TikTok app > Profile > Edit profile > Change photo. File: "UPLOAD THIS 800x800.png" (TikTok shows it
small, about 200 x 200, as a circle).
Note: TikTok has no header or banner image. Your profile page is the grid of video covers, so use the
"TikTok - video cover" template to make that grid look like Kreislo.
{HOW}""", crop=False)
    W, H = 1080, 1920
    ph = (f'<defs><linearGradient id="tph" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A3A3A"/><stop offset="1" stop-color="#202020"/></linearGradient></defs>'
          f'<rect inkscape:label="Placeholder (delete)" width="{W}" height="{H}" fill="url(#tph)"/>'
          + D.drawing('washer', W / 2, 760, 560)
          + T(W / 2, 1130, 'PUT A FRAME FROM YOUR VIDEO HERE', 34, 'Oswald', 500, '#9A9A9A', 'middle', ls=3))
    shade = (f'<defs><linearGradient id="tsh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{INK}" stop-opacity="0.75"/>'
             f'<stop offset="0.25" stop-color="{INK}" stop-opacity="0"/><stop offset="0.55" stop-color="{INK}" stop-opacity="0"/>'
             f'<stop offset="0.8" stop-color="{INK}" stop-opacity="0.92"/><stop offset="1" stop-color="{INK}" stop-opacity="1"/></linearGradient></defs>'
             f'<rect width="{W}" height="{H}" fill="url(#tsh)"/>')
    lg, _ = logo(W / 2, 290, 52, WHITE, ORANGE, anchor='middle')
    b, bw = pill(W / 2, 1530, 'PART 1', 34, anchor='start'); deco += b.replace(f'translate', 'translate')
    deco = lg + pill(W / 2 - (width('PART 1', 34, ls=2) + 52) / 2, 1500, 'PART 1', 34)[0]
    txt = (T(W / 2, 1320, 'WASHING MACHINE', 104, 'Oswald', 600, WHITE, 'middle', label='Title line 1')
           + T(W / 2, 1430, 'CHECK', 104, 'Oswald', 600, ORANGE, 'middle', label='Title line 2'))
    L = [layer('1 · PICTURE – a frame from your video', ph), layer('2 · DARK FADE (locked, keeps text readable)', shade, locked=True),
         layer('3 · LOGO AND CHIP', deco), layer('4 · TEXT – double-click to edit', txt),
         guide_layer(W, H, [(0, 240, W, 1440, '#00A3FF', 'PROFILE GRID shows this 3:4 part'), (0, 0, W, H, '#22BB55', 'FULL SCREEN 9:16')],
                     'Keep the title inside the blue box')]
    add(f'{nxt()} TikTok - video cover', 'TikTok - video cover', 'Kreislo TikTok video cover', W, H, L,
        f"""Kreislo - TikTok - video cover (also Instagram Reels and YouTube Shorts covers)
The picture shown for a video in your profile grid. TikTok: when posting, tap "Edit cover" > "Add photo" (or
"Upload from gallery" where available) and choose the exported PNG. Size 1080 x 1920.
Your profile grid crops covers to 3:4, so the logo and title sit inside the middle 1080 x 1440 (blue box).
Put a frame from the video in layer "1 · PICTURE"; the dark fade keeps the white text readable on any picture.
{HOW}""")

    # ===== Instagram =====
    W = 1080; L = profile_symbol(W)
    add(f'{nxt()} Instagram - profile picture', 'Instagram - profile picture', 'Kreislo Instagram profile picture', W, W, L,
        f"""Kreislo - Instagram - profile picture
Upload: Instagram app > Profile > Edit profile > Edit picture. File: "UPLOAD THIS 1080x1080.png" (shown as a small circle).
Instagram has no header image; use the story highlight covers (next folders) to brand the profile.
{HOW}""", crop=False)
    for topic, kind in [('Shop', 'shop'), ('Delivery', 'delivery'), ('Kenya', 'kenya'), ('Reviews', 'reviews'),
                        ('Fulfilment', 'fulfilment'), ('Questions', 'faq')]:
        W, H = 1080, 1920
        body = (f'<rect width="{W}" height="{H}" fill="{INK}"/><circle cx="{W/2}" cy="{H/2}" r="300" fill="#1E1E1E"/>'
                + f'<circle cx="{W/2}" cy="{H/2}" r="300" fill="none" stroke="{ORANGE}" stroke-width="14"/>' + icon(kind, W / 2, H / 2, 300))
        L = [layer('1 · COVER (locked)', body, locked=True),
             guide_layer(W, H, [(W / 2 - 330, H / 2 - 330, 660, 660, '#00A3FF', 'shown as a circle')], '')]
        add(f'{nxt()} Instagram - story highlight cover - {topic}', f'Instagram - story highlight cover - {topic}',
            f'Kreislo Instagram highlight {topic}', W, H, L,
            f"""Kreislo - Instagram - story highlight cover: {topic}
The round covers under your Instagram bio that group your saved stories. Name the highlight "{topic}" in the app.
How: post this picture as a story (or keep it in your phone), then Profile > the highlight > Edit highlight >
Edit cover > choose this picture. Size 1080 x 1920; only the circle in the middle is shown.
Also works as a Facebook story highlight.
{HOW}""", crop=False)

    # ===== X (Twitter) =====
    W, H = 1500, 500
    deco = bg(W, H, ring_at=(1330, 250), ring_d=820, ring_op=0.07)
    deco += f'<rect x="0" y="{H-8}" width="{W}" height="8" fill="{ORANGE}"/>'
    lg, lw = logo(W - 80, 128, 84, WHITE, ORANGE, anchor='end'); deco += lg
    txt = (tagline_live(W - 80, 266, 22, 'end')
           + T(W - 80, 330, SERV1, 28, 'Open Sans', 600, WHITE, 'end', label='Line 1')
           + T(W - 80, 372, SERV2, 26, 'Open Sans', 400, GREY, 'end', label='Line 2'))
    L = [layer('1 · BACKGROUND AND LOGO (locked)', deco, locked=True), layer('2 · TEXT – double-click to edit', txt),
         guide_layer(W, H, [(0, 60, W, 380, '#00A3FF', 'some phones cut top and bottom'), (20, 300, 300, 200, '#FF00AA', 'profile picture')], '')]
    add(f'{nxt()} X (Twitter) - header', 'X (Twitter) - header', 'Kreislo X header', W, H, L,
        f"""Kreislo - X (Twitter) - header image
Upload: Profile > Edit profile > header photo. File: "UPLOAD THIS 1500x500.png". The profile picture covers the
bottom left, and some phones trim the top and bottom, so the text is on the right and in the middle band.
{HOW}""")
    W = 400; L = profile_symbol(W)
    add(f'{nxt()} X (Twitter) - profile picture', 'X (Twitter) - profile picture', 'Kreislo X profile picture', W, W, L,
        f"""Kreislo - X (Twitter) - profile picture
Upload: Profile > Edit profile > profile photo. File: "UPLOAD THIS 400x400.png" (also 800x800). Shown as a circle.
{HOW}""", extra=[('Kreislo - X (Twitter) - profile picture - 800x800.png', 800, 800)], crop=False)

    # ===== WhatsApp Business =====
    W = 640; L = profile_symbol(W, bgc=ORANGE, ringc=WHITE, k=WHITE)
    add(f'{nxt()} WhatsApp Business - profile picture', 'WhatsApp Business - profile picture', 'Kreislo WhatsApp profile picture', W, W, L,
        f"""Kreislo - WhatsApp Business - profile picture
Upload: WhatsApp Business > Settings > tap your picture > Edit. File: "UPLOAD THIS 640x640.png".
Orange background on purpose: it stands out in customers' chat lists. Shown as a small circle.
{HOW}""", crop=False)

    json.dump(jobs, open(os.path.join(OUT, 'jobs-social.json'), 'w'), indent=1)
    print(len(jobs), 'render jobs,', n, 'designs')

if __name__ == '__main__':
    build()
