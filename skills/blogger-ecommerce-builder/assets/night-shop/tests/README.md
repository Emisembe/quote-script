# Night Shop tests

Run from the project root (the folder with `preview/`, `src/`, `apps-script/`).

| Script | What it checks | Run |
|---|---|---|
| `browser-full.js` | Every page at iPhone 13, Galaxy S9+, iPad Mini and desktop width (no sideways scroll, no script errors); the whole checkout on a phone: required options, cart quantity, empty-form message, delivery partners and price change, Place order (sheet + bank details), WhatsApp, Telegram (copy), email, PayPal button, digital-only checkout; homepage blocks, FAQ, WhatsApp button under the cart drawer, newsletter, Kenya request form. The Google Sheet, YouTube and the blog feed are faked. | `python3 -m http.server 8765 --bind 127.0.0.1 &` then `node tests/browser-full.js <screenshot folder>` |
| `inbox-orders.js` | Code.gs in Node with fake Google services: header upgrade of an old Orders tab, delivery/weight fees re-checked server side, digital orders, Downloads tab, Status = Paid → download email, menu resend, cached products. | `node tests/inbox-orders.js apps-script/Code.gs <out folder>` |
| `inbox-requests.js` | Code.gs request forms (Requests tab, owner email, consent and contact checks) and newsletter double opt-in (confirm / unsubscribe links, duplicates, invalid tokens). | `node tests/inbox-requests.js apps-script/Code.gs` |

A "FAIL" can be the test, not the shop: read the info column before changing code (example: choosing pickup
does not change a total that is already above `free_shipping_over`).
