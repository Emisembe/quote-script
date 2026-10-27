#!/usr/bin/env bash
# Builds index.offline.html: the same app with Chart.js and the compiled
# Tailwind CSS embedded, so it runs with no network connection at all.
# Requires Node.js and npm (only at build time).
set -euo pipefail
cd "$(dirname "$0")"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
(cd "$WORK" && npm init -y >/dev/null && npm install --silent tailwindcss@3.4.16 chart.js@4.4.1)
printf "module.exports = { content: ['%s/index.html'] };\n" "$PWD" > "$WORK/tw.config.js"
printf '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n' > "$WORK/in.css"
"$WORK/node_modules/.bin/tailwindcss" -c "$WORK/tw.config.js" -i "$WORK/in.css" -o "$WORK/tw.css" --minify
node - "$WORK/tw.css" "$WORK/node_modules/chart.js/dist/chart.umd.js" <<'JS'
const fs = require('fs');
const [css, chart] = process.argv.slice(2).map(f => fs.readFileSync(f, 'utf8'));
let html = fs.readFileSync('index.html', 'utf8');
const tw = /<script src="https:\/\/cdn\.tailwindcss\.com[^"]*"><\/script>\s*<script>[\s\S]*?<\/script>/;
const cj = /<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/chart\.js[^"]*"><\/script>/;
if (!tw.test(html) || !cj.test(html)) throw new Error('CDN tags not found in index.html');
html = html.replace(tw, () => `<style>${css}</style>`)
           .replace(cj, () => `<script>${chart.replace(/<\/script/gi, '<\\/script')}</script>`);
fs.writeFileSync('index.offline.html', html);
console.log('Wrote index.offline.html (' + Math.round(html.length / 1024) + ' KB)');
JS
