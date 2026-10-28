# Claude skills

| Skill | What it does |
|---|---|
| `blogger-theme-builder` | Build, fix and audit Blogger XML themes that upload cleanly (grounded in a proven reference theme). |
| `blogger-ecommerce-builder` | Adds a shop to a Blogger theme: product posts, cart, checkout (WhatsApp / email / PayPal / Apps Script order inbox), Product structured data, and an audit for shop templates such as SpotCommerce. Uses `blogger-theme-builder`. |

Ready-to-upload packages are in `../dist/*.skill`.
Upload them in claude.ai's Skills settings. `blogger-theme-builder.skill` is an updated version of an existing
skill: if the upload doesn't replace the old one, remove the old one so only one copy is active.
