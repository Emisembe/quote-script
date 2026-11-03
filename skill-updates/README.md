# Skill update: blogger-theme-builder

Lessons from rebuilding the Murdock Emisembe Foundation theme, folded into the
skill. Upload `blogger-theme-builder.zip` in claude.ai (Settings → Capabilities →
Skills) to replace the current version.

What changed:
- `scripts/extract_reference.py`: parses old themes with undeclared `xlink:` prefixes;
  writes `free_text_settings` and more default banned demo strings.
- `scripts/check.py`: free-text settings (menu links, captions, Blog labels) no longer
  fail the "proven value" rule; blank values are still caught. Mutation-tested.
- New `scripts/render_preview.py` (renders the real theme.xml into preview pages with
  sample posts) and `scripts/preview_test.js` (Playwright checks and screenshots).
- `references/pitfalls.md`: ThemeForest/Areda demo leftovers, rebuild-vs-patch with
  widget ids kept, `body .section` beating section classes, hidden Image gadgets as
  editable photo backgrounds, hiding `#` social icons, `<template>` excerpts,
  fetch-based related posts, `_Name` dropdown menus, smooth-scroll test trap.
- `SKILL.md`: points to the new preview renderer; notes on bought-template references.
