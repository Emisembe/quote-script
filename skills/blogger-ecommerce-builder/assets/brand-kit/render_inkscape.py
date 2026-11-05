"""Export every job with Inkscape itself (PNG at the job's dpi/width, vector PDF with text as paths).
Run: python3 -I render.py <jobs.json>"""
import json, subprocess, sys, os
jobs = json.load(open(sys.argv[1]))
for j in jobs:
    out = j['out']; cmd = ['inkscape', j['svg'], '--export-area-page', f'--export-filename={out}']
    if out.endswith('.pdf'):
        cmd += ['--export-type=pdf', '--export-text-to-path', '--export-pdf-version=1.5']
    elif 'mm' in j:
        cmd += ['--export-type=png', f"--export-dpi={j['dpi']}"]
    else:
        cmd += ['--export-type=png', f"--export-width={int(j['w'] * j.get('scale', 1))}"]
    r = subprocess.run(cmd, capture_output=True, text=True)
    err = [l for l in r.stderr.splitlines() if l.strip() and 'Gtk' not in l and 'dbus' not in l.lower() and 'Fontconfig' not in l]
    if r.returncode or not os.path.exists(out):
        print('FAIL', out, r.stderr[-500:]); continue
    if err: print('note', os.path.basename(out), err[:3])
print('exported', len(jobs))
