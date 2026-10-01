# The African Tech Opportunity — Google Sheets dashboard

A single Google Apps Script file (`AfricaTechPotential.gs`). It builds a workbook showing what the business models of big Western tech firms could be worth if they were built for Africa, compared using population, internet reach and income.

## Install (2 minutes)
1. Create a new Google Sheet ▸ **Extensions ▸ Apps Script**.
2. Delete the sample code, paste in all of `AfricaTechPotential.gs` and click **Save**.
3. Pick `buildAll` in the function dropdown, click **Run** and approve the permissions prompt.
4. Go back to the sheet. A **🌍 Africa Tech** menu appears the next time you reload it.

## What you get
| Sheet | Contents |
|---|---|
| Dashboard | 6 KPI tiles, 6 insight sentences that update themselves, 6 charts |
| Africa Potential | The model for each company: Conservative / Base / Bull today, Base 2050, market value, "one startup" value, plus African success stories |
| Global Firms | 17 Western firms (Amazon, Google, Microsoft, Meta, Uber, Netflix, PayPal, Spotify, Airbnb, DoorDash, Shopify, Revolut, Robinhood, Teladoc, Zillow, Upwork, Duolingo), their revenue, the African players in each space and an idea to build |
| Population | Africa vs the West (2024 and 2050), population 1950–2100, 21-country comparison |
| Assumptions | Every input. The yellow cells can be edited |
| Read Me | Method, sources and caveats |

## The method
`Africa value = (Western revenue ÷ Western internet users) × Africans online × (African income ÷ Western income) × scenario multiplier`

All figures are rounded public estimates (FY2024 annual reports, UN WPP 2024, ITU, IMF). They show the scale of the opportunity and are not investment advice.
