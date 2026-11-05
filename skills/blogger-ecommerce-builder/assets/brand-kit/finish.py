"""After rendering: favicon.ico, see-through watermark, Word letterhead, guidelines, zips. Run: python3 -I finish.py <root>"""
import json, os, shutil, subprocess, sys, zipfile
from PIL import Image
ROOT = sys.argv[1]; J = json.load(open(os.path.join(ROOT, 'jobs.json')))
OUT = os.path.join(ROOT, 'final')
for step in J['post']:
    if step[0] == 'ico':
        Image.open(step[1]).save(step[2], sizes=[(16, 16), (32, 32), (48, 48)])
    elif step[0] == 'fade':
        im = Image.open(step[1]).convert('RGBA'); a = im.getchannel('A').point(lambda v: v // 2); im.putalpha(a); im.save(step[2])
    elif step[0] == 'docx':
        from docx import Document
        from docx.shared import Cm, Pt, RGBColor
        from docx.enum.text import WD_ALIGN_PARAGRAPH
        logo = os.path.join(ROOT, 'masters_png_letterhead.png')
        d = Document(); sec = d.sections[0]
        sec.page_width, sec.page_height = Cm(21), Cm(29.7)
        sec.left_margin = sec.right_margin = Cm(2.0); sec.top_margin = Cm(4.2); sec.bottom_margin = Cm(3.2); sec.header_distance = Cm(1.4)
        st = d.styles['Normal']; st.font.name = 'Open Sans'; st.font.size = Pt(10.5)
        hp = sec.header.paragraphs[0]; hp.add_run().add_picture(logo, width=Cm(6.2))
        f = sec.footer.paragraphs[0]; f.alignment = WD_ALIGN_PARAGRAPH.LEFT
        run = f.add_run('Kreislo · Owner: Your Name · Street 1 · 35390 Gießen · hello@kreislo.de · +49 157 0000000\n'
                        'kreislo.de · VAT ID / Tax no.: … · Bank: Your Bank · IBAN DE00 0000 0000 0000 0000 00')
        run.font.size = Pt(7.5); run.font.color.rgb = RGBColor(0x6B, 0x6B, 0x6B)
        for t in ['Customer Name', 'Street 1', '12345 City', '', 'Gießen, 4 November 2026', '']:
            d.add_paragraph(t)
        h = d.add_paragraph(); r = h.add_run('Subject of your letter'); r.bold = True; r.font.size = Pt(12)
        for t in ['Dear …,', 'Type your letter here.', 'Kind regards', '', 'Your Name', 'Kreislo · Keep good things moving']:
            d.add_paragraph(t)
        d.save(step[1])
# guidelines PDF
gdir = os.path.join(OUT, 'Kreislo Brand Kit', 'A - Brand guidelines')
subprocess.run([sys.executable, '-I', os.path.join(ROOT, 'src', 'guidelines.py'), ROOT], check=True)
os.makedirs(os.path.join(ROOT, '_pages'), exist_ok=True)
subprocess.run(['node', os.path.join(ROOT, 'src', 'guidelines.js'), os.path.join(ROOT, '_guidelines.html'),
                os.path.join(gdir, 'Kreislo - Brand guidelines.pdf'), os.path.join(ROOT, '_pages', 'page-#.png')], check=True)
open(os.path.join(gdir, 'READ ME.txt'), 'w').write('KREISLO - BRAND GUIDELINES\n\nKreislo - Brand guidelines.pdf: the rules for using the logo, colours and fonts. Share it with anyone who designs for Kreislo.\n')
# index files
for top in ('Kreislo Logo Project', 'Kreislo Brand Kit'):
    lines = [f'{top.upper()} - CONTENTS', '', 'Every design is in its own folder: open only the one you need.',
             'Each folder has a PROJECT file (editable original), the ready-made files and a READ ME.', '']
    for dirpath, dirs, files in sorted(os.walk(os.path.join(OUT, top))):
        rel = os.path.relpath(dirpath, os.path.join(OUT, top))
        if rel == '.': continue
        depth = rel.count(os.sep)
        lines.append('  ' * depth + os.path.basename(dirpath) + '/')
    open(os.path.join(OUT, top, '00 CONTENTS - start here.txt'), 'w').write('\n'.join(lines) + '\n')
# zips: one per design + one per package
ind = os.path.join(ROOT, 'downloads', 'One zip per design'); shutil.rmtree(os.path.join(ROOT, 'downloads'), ignore_errors=True); os.makedirs(ind)
def zipdir(src, dest):
    with zipfile.ZipFile(dest, 'w', zipfile.ZIP_DEFLATED) as z:
        for dp, _, fs in os.walk(src):
            for f in sorted(fs):
                full = os.path.join(dp, f); z.write(full, os.path.relpath(full, os.path.dirname(src)))
for group, name in J['designs']:
    pkg = 'Logo' if 'Logo Project' in group else 'Brand Kit'
    zipdir(os.path.join(group, name), os.path.join(ind, f'Kreislo {pkg} - {name}.zip'))
for top in ('Kreislo Logo Project', 'Kreislo Brand Kit'):
    zipdir(os.path.join(OUT, top), os.path.join(ROOT, 'downloads', top + ' (everything).zip'))
print('zips:', len(os.listdir(ind)), '+ 2 packages')
