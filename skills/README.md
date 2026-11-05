# Claude skills

| Skill | What it does |
|---|---|
| `blogger-theme-builder` | Build, fix and audit Blogger XML themes that upload cleanly (grounded in a proven reference theme). |
| `blogger-ecommerce-builder` | Turns a Blogger blog into a full shop and business site. Ships the complete, tested **Night Shop** theme (`assets/night-shop/`): products with options, weight, video and digital downloads; cart and checkout (order sheet, WhatsApp, Telegram, email; bank, PayPal.Me) with delivery partners; Google Sheet inbox with order, request and newsletter tabs; homepage sections (services, steps, reviews, FAQ, newsletter, partners, trust row, announcement bar, WhatsApp button); team, fulfilment and export pages; DE/FR; owner guide and test scripts. Also a logo/brand-kit generator (`assets/brand-kit/`) and an audit for templates such as SpotCommerce. Uses `blogger-theme-builder`. |

Ready-to-upload packages are in `../dist/*.skill`.
Upload them in claude.ai's Skills settings. `blogger-theme-builder.skill` is an updated version of an existing
skill: if the upload doesn't replace the old one, remove the old one so only one copy is active.
