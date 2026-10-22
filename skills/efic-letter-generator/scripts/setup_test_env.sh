#!/usr/bin/env bash
# Installs what scripts/test_letter.js needs into WORKDIR (default ./letter-test):
# the page's own libraries (served locally, because CDNs are often blocked in sandboxes),
# jsQR to read the GiroCode back, and Playwright if it isn't already available.
set -e
W="${1:-./letter-test}"
mkdir -p "$W"
cd "$W"
[ -f package.json ] || echo '{"private": true}' > package.json
npm install --no-audit --no-fund --silent html2canvas@1.4.1 jspdf@2.5.1 qrcode-generator@1.4.4 jsqr@1.4.0
if ! node -e "require.resolve('playwright')" 2>/dev/null && [ ! -d /opt/node-tools/node_modules/playwright ]; then
  npm install --no-audit --no-fund --silent playwright
  [ -n "$PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD" ] || npx playwright install chromium
fi
command -v pdfinfo >/dev/null || echo "note: poppler-utils (pdfinfo, pdftotext, pdfimages) not found; print/PDF checks will be skipped"
echo "ready: $(pwd)"
