/*******************************************************************************
 * THE AFRICAN TECH OPPORTUNITY — one-file Google Apps Script
 *
 * What it does
 *   Builds a complete, live workbook that shows how much the business models of
 *   big Western tech firms (Amazon, Google, Meta, Uber, Netflix, PayPal, ...)
 *   could be worth if replicated for Africa — using population, internet reach
 *   and income comparisons. Everything is shown in numbers, text and charts.
 *
 * How to use
 *   1. Open a new Google Sheet ▸ Extensions ▸ Apps Script.
 *   2. Delete any code there, paste this whole file, click Save.
 *   3. Run the function  buildAll  once (approve the permissions prompt).
 *      After that you can also use the menu  🌍 Africa Tech ▸ Build / rebuild.
 *   4. Change the yellow cells on the "Assumptions" sheet (or the yellow
 *      revenue / share cells on "Global Firms") — every number, sentence and
 *      chart updates automatically.
 *
 * Sheets created
 *   Dashboard ........ headline numbers, written insights, 6 charts
 *   Africa Potential . the model: what each business is worth in Africa
 *   Global Firms ..... the Western companies, their revenue, African players
 *   Population ....... Africa vs the West, 1950–2100, country comparison
 *   Assumptions ...... every input you can change
 *   Read Me .......... method, sources and caveats
 *
 * All figures are rounded public estimates (FY2024 annual reports, UN World
 * Population Prospects 2024, ITU, IMF). Treat results as an illustration of
 * scale, not as investment advice.
 ******************************************************************************/

/* ============================== CONFIG ===================================== */

const SHEETS = {
  DASH: 'Dashboard',
  AFRICA: 'Africa Potential',
  FIRMS: 'Global Firms',
  POP: 'Population',
  ASSUME: 'Assumptions',
  README: 'Read Me'
};

const COLORS = {
  green: '#0B6E4F', greenLight: '#E3F1EA',
  gold: '#E9A23B', goldLight: '#FDF1DC',
  blue: '#3A6EA5', blueLight: '#E4EDF7',
  grey: '#9AA5B1', greyLight: '#F4F5F7',
  dark: '#1F2933', input: '#FFF6C7', white: '#FFFFFF'
};

// First data row on "Global Firms" and "Africa Potential" (row 4 = headers).
const FIRST_ROW = 5;

/* --- Editable inputs. Each becomes a named range used by every formula. --- */
const ASSUMPTIONS = [
  { name: 'WEST_POP',      label: 'The West: population 2024 (USA, Canada, EU-27, UK)', value: 900,  unit: 'millions', note: 'USA 341 + Canada 41 + EU-27 449 + UK 69 (UN WPP 2024, rounded)' },
  { name: 'WEST_POP_2050', label: 'The West: population 2050',                         value: 925,  unit: 'millions', note: 'UN WPP 2024 medium variant, approx.' },
  { name: 'AFR_POP',       label: 'Africa: population 2024 (54 countries)',            value: 1520, unit: 'millions', note: 'UN WPP 2024, approx.' },
  { name: 'AFR_POP_2050',  label: 'Africa: population 2050',                           value: 2480, unit: 'millions', note: 'UN WPP 2024 medium variant, approx.' },
  { name: 'WEST_NET',      label: 'The West: share of people online',                  value: 0.92, unit: 'share',    note: 'ITU / DataReportal, approx.' },
  { name: 'AFR_NET',       label: 'Africa: share of people online 2024',               value: 0.38, unit: 'share',    note: 'ITU estimate ~37–40%' },
  { name: 'AFR_NET_2050',  label: 'Africa: share of people online 2050 (your view)',   value: 0.75, unit: 'share',    note: 'Assumption — smartphones and data keep getting cheaper' },
  { name: 'WEST_GDP',      label: 'The West: income per person (GDP/capita, USD)',     value: 58000, unit: 'usd',     note: 'Population-weighted, IMF WEO 2024, approx.' },
  { name: 'AFR_GDP',       label: 'Africa: income per person 2024 (GDP/capita, USD)',  value: 2000, unit: 'usd',      note: 'IMF WEO 2024, approx.' },
  { name: 'AFR_GDP_2050',  label: 'Africa: income per person 2050 (in 2024 USD)',      value: 4000, unit: 'usd',      note: 'Assumption ≈ 2.7% real growth per year' },
  { name: 'MULT_CONS',     label: 'Scenario multiplier — Conservative',                value: 0.5,  unit: 'x',        note: 'Slower adoption, lower prices, more competition' },
  { name: 'MULT_BASE',     label: 'Scenario multiplier — Base',                        value: 1,    unit: 'x',        note: 'Spending scales exactly with income and internet reach' },
  { name: 'MULT_BULL',     label: 'Scenario multiplier — Bull',                        value: 2.5,  unit: 'x',        note: '≈ purchasing-power (PPP) view + mobile-first leapfrogging (like M-Pesa)' },
  { name: 'VAL_MULT',      label: 'Valuation multiple (company value ÷ yearly revenue)', value: 5,  unit: 'x',        note: 'Tech companies often trade at 3–10× revenue' },
  { name: 'MKT_SHARE',     label: 'Market share one African startup could win',        value: 0.10, unit: 'share',    note: 'Used for the "one startup" columns' }
];

const UNIT = {
  millions: { text: 'million people', fmt: '#,##0' },
  share:    { text: '% (0–100%)',      fmt: '0%' },
  usd:      { text: 'USD per person per year', fmt: '"$"#,##0' },
  x:        { text: 'multiplier',      fmt: '0.0"×"' }
};

/* --- Western firms (sorted by revenue). Revenue = FY2024, USD bn, rounded.
 *     "West share" = estimated share of revenue earned in USA/Canada/Europe. */
const FIRMS = [
  // Company, Sector, HQ, What they do, Revenue, West share, African players today, Idea to build for Africa
  ['Amazon', 'E-commerce & Logistics', 'USA', 'Online marketplace, logistics, AWS cloud', 638, 0.80,
   'Jumia, Takealot, Kilimall, Konga', 'Pan-African marketplace with its own last-mile delivery, pay-on-delivery and mobile-money checkout'],
  ['Alphabet (Google)', 'Advertising & Social', 'USA', 'Search, YouTube, digital advertising', 350, 0.70,
   'No African-owned leader yet', 'Local-language search & voice, plus an Africa-wide ad network for small businesses'],
  ['Microsoft', 'Cloud & Software', 'USA', 'Azure cloud, Office, business software', 245, 0.75,
   'Africa Data Centres, Cassava, Seamfix', 'Local data centres and low-cost business software priced in local currency'],
  ['Meta', 'Advertising & Social', 'USA', 'Facebook, Instagram, WhatsApp advertising', 165, 0.70,
   'No African-owned leader yet', 'Creator and social-commerce platform built around chat-based selling'],
  ['Uber', 'Mobility & Delivery', 'USA', 'Ride-hailing and delivery app', 44, 0.80,
   'SafeBoda, Little, Yango, Bolt (EU)', 'Motorbike/boda-boda and tricycle ride-hailing with cash and mobile-money payment'],
  ['Netflix', 'Media & Entertainment', 'USA', 'Subscription video streaming', 39, 0.70,
   'Showmax, IrokoTV', 'Nollywood & African-content streaming sold in daily/weekly mobile data bundles'],
  ['PayPal', 'Fintech', 'USA', 'Online payments and digital wallets', 31.8, 0.75,
   'Flutterwave, Paystack, M-Pesa, OPay, Moniepoint, Wave', 'Cross-border payments, merchant payments and diaspora remittances'],
  ['Spotify', 'Media & Entertainment', 'Sweden', 'Music & podcast streaming', 17, 0.70,
   'Boomplay, Mdundo, Audiomack', 'Afrobeats/Amapiano-first streaming billed through the mobile operator'],
  ['Airbnb', 'Property & Travel', 'USA', 'Short-term stays marketplace', 11.1, 0.80,
   'Hotels.ng, Travelstart, Wakanow', 'Diaspora and intra-African travel stays with verified hosts and mobile-money booking'],
  ['DoorDash', 'Mobility & Delivery', 'USA', 'Food & grocery delivery', 10.7, 0.98,
   'Chowdeck, Mr D, Glovo (EU)', 'Food, pharmacy and grocery delivery for dense African cities'],
  ['Shopify', 'E-commerce & Logistics', 'Canada', 'Online-store software for merchants', 8.9, 0.85,
   'Bumpa, Selar, Paystack Storefront', '"Shop in a phone" for market traders, with WhatsApp & Instagram checkout'],
  ['Revolut', 'Fintech', 'UK', 'Mobile-first bank', 4.0, 0.85,
   'Kuda, TymeBank, Moniepoint, Chipper Cash', 'Mobile bank for the unbanked: savings, small loans, multi-currency wallets'],
  ['Robinhood', 'Fintech', 'USA', 'Retail stock & crypto investing', 2.95, 1.00,
   'Bamboo, Risevest, EasyEquities, Chaka', 'Micro-investing in local and US shares from $1'],
  ['Teladoc', 'Health, Education & Work', 'USA', 'Telemedicine', 2.57, 0.90,
   'Helium Health, mPharma, Reliance Health', 'Tele-doctor + e-pharmacy + micro health insurance on the phone'],
  ['Zillow', 'Property & Travel', 'USA', 'Property search & listings', 2.24, 1.00,
   'Property24, PropertyPro, Private Property', 'Verified rental & land listings with escrow payments (fights property fraud)'],
  ['Upwork', 'Health, Education & Work', 'USA', 'Freelance talent marketplace', 0.77, 0.75,
   'Andela, Gebeya, Moringa', 'Export African developers, designers and support staff to global clients'],
  ['Duolingo', 'Health, Education & Work', 'USA', 'Gamified language-learning app', 0.75, 0.65,
   'uLesson, Eneza, Gradely', 'Exam-prep and skills app in local languages that works offline on cheap phones']
];

/* --- Proof it already works in Africa --- */
const AFRICAN_WINS = [
  ['M-Pesa (Safaricom)', 'Kenya', 'Mobile money', '50m+ users across Africa; > $1bn yearly revenue for Safaricom'],
  ['Flutterwave', 'Nigeria', 'Payments infrastructure', 'Valued at ~$3bn (2022)'],
  ['Paystack', 'Nigeria', 'Online payments', 'Bought by Stripe for $200m+ (2020)'],
  ['OPay', 'Nigeria', 'Payments super-app', 'Valued at ~$2bn (2021)'],
  ['Chipper Cash', 'Pan-African', 'Cross-border payments', 'Valued at ~$2bn (2021)'],
  ['Wave', 'Senegal', 'Mobile money', 'Valued at ~$1.7bn (2021)'],
  ['Andela', 'Nigeria / Kenya', 'Tech talent export', 'Valued at ~$1.5bn (2021)'],
  ['Moniepoint', 'Nigeria', 'Business banking & payments', 'Became a $1bn+ "unicorn" (2024)'],
  ['TymeBank (Tyme Group)', 'South Africa', 'Digital bank', 'Became a $1bn+ "unicorn" (2024)'],
  ['Jumia', 'Pan-African', 'E-commerce', 'Listed on the New York Stock Exchange (2019)']
];

/* --- Countries: population 2024 (m), share online, median age (approx.) --- */
const COUNTRIES = [
  ['Nigeria', 'Africa', 229, 0.45, 18], ['Ethiopia', 'Africa', 129, 0.21, 19],
  ['Egypt', 'Africa', 116, 0.72, 24],   ['DR Congo', 'Africa', 109, 0.27, 16],
  ['Tanzania', 'Africa', 68, 0.32, 18], ['South Africa', 'Africa', 64, 0.75, 28],
  ['Kenya', 'Africa', 56, 0.41, 20],    ['Uganda', 'Africa', 50, 0.27, 16],
  ['Algeria', 'Africa', 47, 0.77, 28],  ['Morocco', 'Africa', 38, 0.90, 29],
  ['Ghana', 'Africa', 34, 0.70, 21],    ["Côte d'Ivoire", 'Africa', 32, 0.40, 19],
  ['Senegal', 'Africa', 18, 0.60, 19],  ['Rwanda', 'Africa', 14, 0.34, 20],
  ['USA', 'West', 341, 0.92, 38],       ['Germany', 'West', 84, 0.93, 45],
  ['UK', 'West', 69, 0.97, 40],         ['France', 'West', 68, 0.92, 42],
  ['Italy', 'West', 59, 0.86, 48],      ['Spain', 'West', 48, 0.95, 45],
  ['Canada', 'West', 41, 0.94, 41]
].sort((a, b) => b[2] - a[2]);

/* --- Population over time (millions). 2024/2050 come from Assumptions. --- */
const TRAJECTORY = [
  ['1950', 228, 576], ['1975', 416, 700], ['2000', 819, 801],
  ['2024', '=AFR_POP', '=WEST_POP'], ['2050', '=AFR_POP_2050', '=WEST_POP_2050'],
  ['2075', 3200, 920], ['2100', 3800, 900]
];

// Row positions on the Population sheet (used by Dashboard formulas).
const POP_C_FIRST = 17;
const POP_C_LAST = POP_C_FIRST + COUNTRIES.length - 1;

/* ============================== MENU ======================================= */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🌍 Africa Tech')
    .addItem('Build / rebuild dashboard (keeps your inputs)', 'buildAll')
    .addItem('Reset everything to default numbers', 'resetToDefaults')
    .addSeparator()
    .addItem('How the model works', 'showAbout')
    .addToUi();
}

function buildAll() { build_(false); }

function resetToDefaults() {
  const ui = SpreadsheetApp.getUi();
  const ok = ui.alert('Reset to defaults?',
    'This rebuilds every sheet and puts all yellow input cells back to their default values.',
    ui.ButtonSet.OK_CANCEL);
  if (ok === ui.Button.OK) build_(true);
}

function showAbout() {
  SpreadsheetApp.getUi().alert('How the model works',
    'For each Western company:\n\n' +
    '1. Revenue earned in the West ÷ people in the West = what an average Western person spends with that company per year.\n' +
    '2. Divide by the share of Westerners online = spend per Western internet user.\n' +
    '3. Multiply by the number of Africans online.\n' +
    '4. Multiply by the affordability factor (African income ÷ Western income).\n' +
    '5. Multiply by the scenario multiplier (Conservative / Base / Bull).\n\n' +
    '2050 uses Africa\'s projected population, internet reach and income.\n' +
    'Company value = yearly revenue × valuation multiple.\n\n' +
    'Change the yellow cells on "Assumptions" and everything updates.',
    SpreadsheetApp.getUi().ButtonSet.OK);
}

/* ============================== BUILD ====================================== */

function build_(resetInputs) {
  const ss = SpreadsheetApp.getActive();
  const saved = resetInputs ? { inputs: {}, firms: {} } : readSaved_(ss);
  ss.toast('Building your Africa tech dashboard…', '🌍 Africa Tech', 10);

  buildAssumptions_(ss, saved);
  buildPopulation_(ss);
  buildFirms_(ss, saved);
  buildAfrica_(ss);
  buildDashboard_(ss);
  buildReadMe_(ss);

  [SHEETS.DASH, SHEETS.AFRICA, SHEETS.FIRMS, SHEETS.POP, SHEETS.ASSUME, SHEETS.README]
    .forEach((name, i) => { ss.setActiveSheet(ss.getSheetByName(name)); ss.moveActiveSheet(i + 1); });
  ss.setActiveSheet(ss.getSheetByName(SHEETS.DASH));
  SpreadsheetApp.flush();
  ss.toast('Done! Change the yellow cells on "Assumptions" to explore.', '🌍 Africa Tech', 8);
}

/** Keep the user's edited inputs when rebuilding. */
function readSaved_(ss) {
  const out = { inputs: {}, firms: {} };
  ASSUMPTIONS.forEach(a => {
    const r = ss.getRangeByName(a.name);
    if (r) {
      const v = r.getValue();
      if (typeof v === 'number') out.inputs[a.name] = v;
    }
  });
  const fs = ss.getSheetByName(SHEETS.FIRMS);
  if (fs && fs.getLastRow() >= FIRST_ROW) {
    fs.getRange(FIRST_ROW, 2, fs.getLastRow() - FIRST_ROW + 1, 6).getValues().forEach(r => {
      if (r[0] && typeof r[4] === 'number' && typeof r[5] === 'number') out.firms[r[0]] = { rev: r[4], share: r[5] };
    });
  }
  return out;
}

/* --------------------------- Assumptions ---------------------------------- */

function buildAssumptions_(ss, saved) {
  const sh = resetSheet_(ss, SHEETS.ASSUME);
  title_(sh, 'A1:D1', 'A2:D2', '⚙️ Assumptions — change the yellow cells',
    'Every number, sentence and chart in this workbook is calculated from these inputs. Edit a yellow cell and watch the Dashboard update.');

  header_(sh.getRange('A4:D4').setValues([['Assumption', 'Value', 'Unit', 'Source / note']]));
  ASSUMPTIONS.forEach((a, i) => {
    const r = 5 + i;
    const v = saved.inputs[a.name] !== undefined ? saved.inputs[a.name] : a.value;
    sh.getRange(r, 1, 1, 4).setValues([[a.label, v, UNIT[a.unit].text, a.note]]);
    const cell = sh.getRange(r, 2);
    cell.setNumberFormat(UNIT[a.unit].fmt).setBackground(COLORS.input).setFontWeight('bold').setHorizontalAlignment('center');
    setName_(ss, a.name, cell);
  });
  const last = 4 + ASSUMPTIONS.length;
  sh.getRange(5, 1, ASSUMPTIONS.length, 4).setVerticalAlignment('middle').setWrap(true);
  sh.getRange(4, 1, ASSUMPTIONS.length + 1, 4).setBorder(true, true, true, true, true, true, '#D0D5DB', SpreadsheetApp.BorderStyle.SOLID);
  sh.getRange(last + 2, 1, 1, 4).merge()
    .setValue('Tip: the Bull multiplier of ~2.5× roughly equals using purchasing-power (PPP) incomes instead of dollar incomes — money goes further in most African economies.')
    .setFontStyle('italic').setWrap(true).setFontColor('#52606D');
  sh.setRowHeight(last + 2, 36);

  sh.setColumnWidth(1, 380); sh.setColumnWidth(2, 110); sh.setColumnWidth(3, 170); sh.setColumnWidth(4, 430);
  sh.setFrozenRows(4);
}

/* --------------------------- Population ----------------------------------- */

function buildPopulation_(ss) {
  const sh = resetSheet_(ss, SHEETS.POP);
  title_(sh, 'A1:H1', 'A2:H2', '👥 Population: Africa vs the West',
    'Africa is the youngest and fastest-growing region on Earth. By 2050 roughly one in four people in the world will be African.');

  // Region comparison
  sh.getRange('A4').setValue('Africa vs the West').setFontWeight('bold').setFontSize(12);
  header_(sh.getRange('A5:D5').setValues([['Metric', 'Africa', 'The West*', 'Africa ÷ West']]));
  sh.getRange(6, 1, 7, 4).setValues([
    ['Population 2024 (millions)', '=AFR_POP', '=WEST_POP', '=B6/C6'],
    ['Population 2050 (millions)', '=AFR_POP_2050', '=WEST_POP_2050', '=B7/C7'],
    ['Growth 2024 → 2050', '=B7/B6-1', '=C7/C6-1', ''],
    ['Internet users 2024 (millions)', '=AFR_POP*AFR_NET', '=WEST_POP*WEST_NET', '=B9/C9'],
    ['Internet users 2050 (millions)', '=AFR_POP_2050*AFR_NET_2050', '=WEST_POP_2050*WEST_NET', '=B10/C10'],
    ['Income per person (USD/yr)', '=AFR_GDP', '=WEST_GDP', '=B11/C11'],
    ['Median age (years)', 19, 42, '=B12/C12']
  ]);
  sh.getRange('B6:C7').setNumberFormat('#,##0');
  sh.getRange('B8:C8').setNumberFormat('+0%;-0%');
  sh.getRange('B9:C10').setNumberFormat('#,##0');
  sh.getRange('B11:C11').setNumberFormat('"$"#,##0');
  sh.getRange('B12:C12').setNumberFormat('0').setBackground(COLORS.input);
  sh.getRange('D6:D12').setNumberFormat('0.0"×"');
  sh.getRange('D11').setNumberFormat('0.000"×"');
  sh.getRange('D12').setNumberFormat('0.00"×"');
  sh.getRange('B6:B12').setFontColor(COLORS.green).setFontWeight('bold');
  sh.getRange('C6:C12').setFontColor(COLORS.blue).setFontWeight('bold');
  sh.getRange('A5:D12').setBorder(true, true, true, true, true, true, '#D0D5DB', SpreadsheetApp.BorderStyle.SOLID);
  sh.getRange('A13').setValue('*The West = USA, Canada, EU-27 and UK. Sources: UN World Population Prospects 2024, ITU, IMF (rounded).')
    .setFontStyle('italic').setFontColor('#52606D');

  // Population over time
  sh.getRange('F4').setValue('Population over time (millions)').setFontWeight('bold').setFontSize(12);
  header_(sh.getRange('F5:H5').setValues([['Year', 'Africa', 'The West']]));
  sh.getRange(6, 6, TRAJECTORY.length, 1).setNumberFormat('@');
  sh.getRange(6, 6, TRAJECTORY.length, 3).setValues(TRAJECTORY);
  sh.getRange(6, 7, TRAJECTORY.length, 2).setNumberFormat('#,##0');
  sh.getRange(5, 6, TRAJECTORY.length + 1, 3).setBorder(true, true, true, true, true, true, '#D0D5DB', SpreadsheetApp.BorderStyle.SOLID);

  // Country comparison
  sh.getRange(POP_C_FIRST - 2, 1).setValue('Country comparison (2024)').setFontWeight('bold').setFontSize(12);
  header_(sh.getRange(POP_C_FIRST - 1, 1, 1, 6).setValues([[
    'Country', 'Region', 'Population (millions)', 'Share of people online', 'Internet users (millions)', 'Median age']]));
  sh.getRange(POP_C_FIRST, 1, COUNTRIES.length, 6).setValues(COUNTRIES.map((c, i) => {
    const r = POP_C_FIRST + i;
    return [c[0], c[1], c[2], c[3], `=C${r}*D${r}`, c[4]];
  }));
  sh.getRange(POP_C_FIRST, 3, COUNTRIES.length, 1).setNumberFormat('#,##0');
  sh.getRange(POP_C_FIRST, 4, COUNTRIES.length, 1).setNumberFormat('0%');
  sh.getRange(POP_C_FIRST, 5, COUNTRIES.length, 1).setNumberFormat('#,##0');
  sh.getRange(POP_C_FIRST, 1, COUNTRIES.length, 6).setBackgrounds(
    COUNTRIES.map(c => Array(6).fill(c[1] === 'Africa' ? COLORS.greenLight : COLORS.blueLight)));
  sh.getRange(POP_C_FIRST, 3, COUNTRIES.length, 2).setBackground(COLORS.input);
  sh.getRange(POP_C_FIRST - 1, 1, COUNTRIES.length + 1, 6).setBorder(true, true, true, true, true, true, '#D0D5DB', SpreadsheetApp.BorderStyle.SOLID);

  sh.setColumnWidth(1, 230);
  [2, 3, 4, 5, 6, 7, 8].forEach(c => sh.setColumnWidth(c, 110));
  sh.setColumnWidth(9, 30);

  chart_(sh, Charts.ChartType.LINE, [sh.getRange('F5:H12')], 4, 10, {
    title: 'Population 1950 – 2100 (millions)', colors: [COLORS.green, COLORS.blue],
    width: 620, height: 320, legend: { position: 'bottom' }, pointSize: 6, curveType: 'function'
  });
  chart_(sh, Charts.ChartType.COLUMN,
    [sh.getRange(POP_C_FIRST - 1, 1, COUNTRIES.length + 1, 1), sh.getRange(POP_C_FIRST - 1, 3, COUNTRIES.length + 1, 1),
     sh.getRange(POP_C_FIRST - 1, 5, COUNTRIES.length + 1, 1)], 21, 10, {
    title: 'Population vs internet users by country (millions)', colors: [COLORS.grey, COLORS.green],
    width: 820, height: 360, legend: { position: 'bottom' }, hAxis: { slantedText: true, slantedTextAngle: 45 }
  });
  sh.setFrozenRows(2);
}

/* --------------------------- Global Firms --------------------------------- */

function buildFirms_(ss, saved) {
  const sh = resetSheet_(ss, SHEETS.FIRMS);
  const n = FIRMS.length, last = FIRST_ROW + n - 1, tot = last + 1;
  title_(sh, 'A1:K1', 'A2:K2', '🏢 Global tech firms making big money in the West',
    'Revenue = latest full year (FY2024, USD billions, rounded). "Share earned in the West" is an estimate — edit the yellow cells if you have better data.');

  header_(sh.getRange(4, 1, 1, 11).setValues([[
    '#', 'Company', 'Sector', 'HQ', 'What they do', 'Global revenue FY2024 (USD bn)', 'Share earned in the West (est.)',
    'Revenue from the West (USD bn)', 'Spend per Western person (USD/yr)', 'African players today', 'Idea to build for Africa']]));

  sh.getRange(FIRST_ROW, 1, n, 11).setValues(FIRMS.map((f, i) => {
    const r = FIRST_ROW + i;
    const s = saved.firms[f[0]];
    return [i + 1, f[0], f[1], f[2], f[3], s ? s.rev : f[4], s ? s.share : f[5],
      `=F${r}*G${r}`, `=H${r}*1000/WEST_POP`, f[6], f[7]];
  }));
  sh.getRange(tot, 1, 1, 11).setValues([['', 'TOTAL', '', '', '', `=SUM(F${FIRST_ROW}:F${last})`, `=H${tot}/F${tot}`,
    `=SUM(H${FIRST_ROW}:H${last})`, `=SUM(I${FIRST_ROW}:I${last})`, '', '']]);

  zebra_(sh.getRange(FIRST_ROW, 1, n, 11));
  sh.getRange(FIRST_ROW, 6, n, 2).setBackground(COLORS.input);
  sh.getRange(FIRST_ROW, 6, n + 1, 1).setNumberFormat('#,##0.0');
  sh.getRange(FIRST_ROW, 7, n + 1, 1).setNumberFormat('0%');
  sh.getRange(FIRST_ROW, 8, n + 1, 1).setNumberFormat('#,##0.0');
  sh.getRange(FIRST_ROW, 9, n + 1, 1).setNumberFormat('"$"#,##0.00');
  sh.getRange(FIRST_ROW, 2, n, 1).setFontWeight('bold');
  sh.getRange(FIRST_ROW, 10, n, 2).setWrap(true);
  sh.getRange(FIRST_ROW, 5, n, 1).setWrap(true);
  sh.getRange(FIRST_ROW, 1, n + 1, 11).setVerticalAlignment('middle');
  total_(sh.getRange(tot, 1, 1, 11));
  sh.getRange(4, 1, n + 2, 11).setBorder(true, true, true, true, true, true, '#D0D5DB', SpreadsheetApp.BorderStyle.SOLID);

  [30, 150, 170, 70, 230, 115, 115, 115, 125, 250, 360].forEach((w, i) => sh.setColumnWidth(i + 1, w));
  sh.setFrozenRows(4); sh.setFrozenColumns(2);

  const chartRow = tot + 3;
  chart_(sh, Charts.ChartType.BAR,
    [sh.getRange(4, 2, n + 1, 1), sh.getRange(4, 6, n + 1, 1), sh.getRange(4, 8, n + 1, 1)], chartRow, 2, {
    title: 'Global revenue vs revenue from the West (USD bn, FY2024)', colors: [COLORS.grey, COLORS.blue],
    width: 700, height: 520, legend: { position: 'bottom' }
  });
  chart_(sh, Charts.ChartType.BAR, [sh.getRange(4, 2, n + 1, 1), sh.getRange(4, 9, n + 1, 1)], chartRow, 8, {
    title: 'What the average Western person spends with each firm per year (USD)', colors: [COLORS.gold],
    width: 640, height: 520, legend: { position: 'none' }
  });
}

/* --------------------------- Africa Potential ----------------------------- */

function buildAfrica_(ss) {
  const sh = resetSheet_(ss, SHEETS.AFRICA);
  const n = FIRMS.length, last = FIRST_ROW + n - 1, tot = last + 1;
  const GF = `'${SHEETS.FIRMS}'!`;
  title_(sh, 'A1:M1', 'A2:M2', '💡 The African potential of each business model',
    'Value in Africa = spend per Western internet user × Africans online × affordability (African ÷ Western income) × scenario multiplier.  All money in USD billions per year unless stated.');

  header_(sh.getRange(4, 1, 1, 13).setValues([[
    'Business model (Western example)', 'Sector', 'Spend per Western person (USD/yr)', 'Spend per Western internet user (USD/yr)',
    'Africans online 2024 (millions)', 'Affordability factor (Africa ÷ West income)',
    'Conservative 2024', 'Base 2024', 'Bull 2024', 'Base 2050', 'Market value 2050 (base × multiple)',
    'One startup @ target share: revenue 2050', 'One startup: company value 2050']]));

  const rows = [];
  for (let r = FIRST_ROW; r <= last; r++) {
    rows.push([
      `=${GF}B${r}`, `=${GF}C${r}`, `=${GF}I${r}`, `=C${r}/WEST_NET`, '=AFR_POP*AFR_NET', '=AFR_GDP/WEST_GDP',
      `=D${r}*E${r}*F${r}*MULT_CONS/1000`, `=D${r}*E${r}*F${r}*MULT_BASE/1000`, `=D${r}*E${r}*F${r}*MULT_BULL/1000`,
      `=D${r}*(AFR_POP_2050*AFR_NET_2050)*(AFR_GDP_2050/WEST_GDP)*MULT_BASE/1000`,
      `=J${r}*VAL_MULT`, `=J${r}*MKT_SHARE`, `=L${r}*VAL_MULT`
    ]);
  }
  sh.getRange(FIRST_ROW, 1, n, 13).setValues(rows);
  const sumCols = ['G', 'H', 'I', 'J', 'K', 'L', 'M'].map(c => `=SUM(${c}${FIRST_ROW}:${c}${last})`);
  sh.getRange(tot, 1, 1, 13).setValues([['TOTAL (all ' + n + ' models)', '', '', '', '', ''].concat(sumCols)]);

  zebra_(sh.getRange(FIRST_ROW, 1, n, 13));
  sh.getRange(FIRST_ROW, 3, n, 2).setNumberFormat('"$"#,##0.00');
  sh.getRange(FIRST_ROW, 5, n, 1).setNumberFormat('#,##0');
  sh.getRange(FIRST_ROW, 6, n, 1).setNumberFormat('0.000');
  sh.getRange(FIRST_ROW, 7, n + 1, 7).setNumberFormat('"$"#,##0.0');
  sh.getRange(FIRST_ROW, 1, n, 1).setFontWeight('bold');
  sh.getRange(FIRST_ROW, 8, n + 1, 1).setFontWeight('bold').setFontColor(COLORS.green);
  sh.getRange(FIRST_ROW, 10, n + 1, 1).setFontWeight('bold').setFontColor(COLORS.green);
  total_(sh.getRange(tot, 1, 1, 13));
  sh.getRange(4, 1, n + 2, 13).setBorder(true, true, true, true, true, true, '#D0D5DB', SpreadsheetApp.BorderStyle.SOLID);

  // Heat-map on the 2050 column
  const heat = SpreadsheetApp.newConditionalFormatRule()
    .setGradientMinpoint(COLORS.white).setGradientMaxpoint('#7CC4A4')
    .setRanges([sh.getRange(FIRST_ROW, 10, n, 1)]).build();
  sh.setConditionalFormatRules([heat]);

  // Proof it works
  const pr = tot + 3;
  sh.getRange(pr, 1).setValue('✅ Proof it already works — African tech success stories').setFontWeight('bold').setFontSize(12);
  header_(sh.getRange(pr + 1, 1, 1, 4).setValues([['Company', 'Country', 'What they do', 'Milestone']]));
  sh.getRange(pr + 2, 1, AFRICAN_WINS.length, 4).setValues(AFRICAN_WINS);
  zebra_(sh.getRange(pr + 2, 1, AFRICAN_WINS.length, 4));
  sh.getRange(pr + 1, 1, AFRICAN_WINS.length + 1, 4).setBorder(true, true, true, true, true, true, '#D0D5DB', SpreadsheetApp.BorderStyle.SOLID);

  [230, 170, 110, 115, 110, 120, 105, 105, 105, 105, 130, 135, 130].forEach((w, i) => sh.setColumnWidth(i + 1, w));
  sh.setRowHeight(4, 60);
  sh.setFrozenRows(4); sh.setFrozenColumns(1);

  const cr = pr + AFRICAN_WINS.length + 4;
  chart_(sh, Charts.ChartType.BAR,
    [sh.getRange(4, 1, n + 1, 1), sh.getRange(4, 7, n + 1, 3)], cr, 1, {
    title: 'Yearly revenue potential in Africa today, 3 scenarios (USD bn)',
    colors: [COLORS.grey, COLORS.green, COLORS.gold], width: 720, height: 560, legend: { position: 'bottom' }
  });
  chart_(sh, Charts.ChartType.BAR,
    [sh.getRange(4, 1, n + 1, 1), sh.getRange(4, 8, n + 1, 1), sh.getRange(4, 10, n + 1, 1)], cr, 6, {
    title: 'Today vs 2050 — base case (USD bn per year)',
    colors: [COLORS.green, COLORS.gold], width: 720, height: 560, legend: { position: 'bottom' }
  });
}

/* --------------------------- Dashboard ------------------------------------ */

function buildDashboard_(ss) {
  const sh = resetSheet_(ss, SHEETS.DASH);
  const n = FIRMS.length, last = FIRST_ROW + n - 1, tot = last + 1;
  const AP = `'${SHEETS.AFRICA}'!`, GF = `'${SHEETS.FIRMS}'!`, PP = `'${SHEETS.POP}'!`;
  const cty = `${PP}$A$${POP_C_FIRST}:$E$${POP_C_LAST}`;

  sh.setColumnWidth(1, 20);
  for (let c = 2; c <= 13; c++) sh.setColumnWidth(c, 95);
  sh.setColumnWidth(14, 30); sh.setColumnWidth(15, 220);
  sh.setColumnWidth(16, 100); sh.setColumnWidth(17, 100); sh.setColumnWidth(18, 70);

  title_(sh, 'B1:M1', 'B2:M2', '🌍 The African Tech Opportunity',
    'What if the business models that made Western tech giants rich were built for Africa\'s young, fast-growing, mobile-first population?');

  /* KPI tiles */
  const kpis = [
    ['AFRICA POPULATION 2024', '=AFR_POP/1000', '0.00" bn"', '="vs "&TEXT(WEST_POP/1000,"0.00")&" bn in the West"'],
    ['AFRICANS ONLINE TODAY', '=AFR_POP*AFR_NET', '#,##0" m"', `="USA population: "&TEXT(VLOOKUP("USA",${cty},3,FALSE),"#,##0")&" m"`],
    ['AFRICA POPULATION 2050', '=AFR_POP_2050/1000', '0.00" bn"', '=TEXT(AFR_POP_2050/WEST_POP_2050,"0.0")&"× the West"'],
    [`WESTERN REVENUE, ${n} FIRMS`, `=${GF}H${tot}`, '"$"#,##0" bn"', '="per year, earned in the West"'],
    ['AFRICA POTENTIAL TODAY', `=${AP}H${tot}`, '"$"#,##0" bn"', '="per year (base case)"'],
    ['AFRICA POTENTIAL 2050', `=${AP}J${tot}`, '"$"#,##0" bn"', `="worth ~$"&TEXT(${AP}K${tot},"#,##0")&" bn as companies"`]
  ];
  kpis.forEach((k, i) => {
    const col = 2 + i * 2;
    const bg = i % 2 ? COLORS.goldLight : COLORS.greenLight;
    sh.getRange(4, col, 1, 2).merge().setValue(k[0]).setFontSize(8).setFontWeight('bold').setFontColor('#52606D');
    sh.getRange(5, col, 1, 2).merge().setFormula(k[1]).setNumberFormat(k[2]).setFontSize(20).setFontWeight('bold')
      .setFontColor(i % 2 ? '#9A5B00' : COLORS.green);
    sh.getRange(6, col, 1, 2).merge().setFormula(k[3]).setFontSize(8).setFontColor('#52606D');
    sh.getRange(4, col, 3, 2).setBackground(bg).setHorizontalAlignment('center').setVerticalAlignment('middle')
      .setBorder(true, true, true, true, null, null, COLORS.white, SpreadsheetApp.BorderStyle.SOLID_THICK);
  });
  sh.setRowHeight(4, 24); sh.setRowHeight(5, 42); sh.setRowHeight(6, 22);

  /* Chart data (right-hand side) — built first so insights can reference it */
  sh.getRange('O4').setValue('CHART DATA (auto-calculated — do not edit)').setFontWeight('bold').setFontColor('#52606D');

  block_(sh, 6, 'Africa vs the West (millions)', ['', 'Africa', 'The West'], [
    ['People 2024', '=AFR_POP', '=WEST_POP'],
    ['People 2050', '=AFR_POP_2050', '=WEST_POP_2050'],
    ['Online 2024', '=AFR_POP*AFR_NET', '=WEST_POP*WEST_NET'],
    ['Online 2050', '=AFR_POP_2050*AFR_NET_2050', '=WEST_POP_2050*WEST_NET']
  ], '#,##0');

  block_(sh, 14, 'Top 10 models for Africa, base 2050 (USD bn/yr)', ['Business model', 'USD bn/yr'], null, '"$"#,##0.0');
  sh.getRange('O16').setFormula(`=SORTN({${AP}A${FIRST_ROW}:A${last},${AP}J${FIRST_ROW}:J${last}},10,0,2,FALSE)`);
  sh.getRange('P16:P25').setNumberFormat('"$"#,##0.0');

  const sectors = [...new Set(FIRMS.map(f => f[1]))];
  block_(sh, 28, 'Value by sector, base 2050 (USD bn/yr)', ['Sector', 'USD bn/yr'],
    sectors.map((s, i) => [s, `=SUMIF(${AP}$B$${FIRST_ROW}:$B$${last},O${30 + i},${AP}$J$${FIRST_ROW}:$J$${last})`]), '"$"#,##0.0');

  const scenRow = 30 + sectors.length + 2;
  block_(sh, scenRow, 'Total African potential by scenario (USD bn/yr)', ['Scenario', 'USD bn/yr'], [
    ['Conservative 2024', `=${AP}G${tot}`], ['Base 2024', `=${AP}H${tot}`],
    ['Bull 2024', `=${AP}I${tot}`], ['Base 2050', `=${AP}J${tot}`]
  ], '"$"#,##0');

  const trajRow = scenRow + 8;
  block_(sh, trajRow, 'Population over time (millions)', ['Year', 'Africa', 'The West'],
    TRAJECTORY.map((_, i) => [`=${PP}F${6 + i}`, `=${PP}G${6 + i}`, `=${PP}H${6 + i}`]), '#,##0');

  const onRow = trajRow + TRAJECTORY.length + 4;
  block_(sh, onRow, 'Internet users by country (millions)', ['Country', 'Africa', 'The West', 'sort'], null, '#,##0');
  const pa = `${PP}A${POP_C_FIRST}:A${POP_C_LAST}`, pb = `${PP}B${POP_C_FIRST}:B${POP_C_LAST}`, pe = `${PP}E${POP_C_FIRST}:E${POP_C_LAST}`;
  sh.getRange(onRow + 2, 15).setFormula(
    `=ARRAYFORMULA(SORTN({${pa},IF(${pb}="Africa",${pe},""),IF(${pb}="West",${pe},""),${pe}},12,0,4,FALSE))`);
  sh.getRange(onRow + 2, 16, 12, 3).setNumberFormat('#,##0');
  sh.getRange(onRow + 1, 18, 13, 1).setFontColor('#C0C6CC');

  /* Key insights (live sentences) */
  sh.getRange('B8:M8').merge().setValue('KEY INSIGHTS').setFontWeight('bold').setFontColor(COLORS.white).setBackground(COLORS.dark);
  const usPop = `VLOOKUP("USA",${cty},3,FALSE)`, ukPop = `VLOOKUP("UK",${cty},3,FALSE)`, ngNet = `VLOOKUP("Nigeria",${cty},5,FALSE)`;
  const insights = [
    `="👥  Africa has "&TEXT(AFR_POP/1000,"0.00")&" billion people — "&TEXT(AFR_POP/WEST_POP,"0.0")&"× the population of the whole West (USA, Canada, EU-27 and UK combined)."`,
    `="🌐  "&TEXT(AFR_POP*AFR_NET,"#,##0")&" million Africans are already online — "&IF(AFR_POP*AFR_NET>${usPop},"more than","close to")&" the entire population of the USA ("&TEXT(${usPop},"#,##0")&" m). Yet only "&TEXT(AFR_NET,"0%")&" of Africans are online, vs "&TEXT(WEST_NET,"0%")&" in the West — the growth is still ahead."`,
    `="🇳🇬  Nigeria alone has ~"&TEXT(${ngNet},"#,##0")&" million internet users — "&IF(${ngNet}>${ukPop},"more than","close to")&" the whole population of the UK ("&TEXT(${ukPop},"#,##0")&" m)."`,
    `="📈  By 2050 Africa adds "&TEXT(AFR_POP_2050-AFR_POP,"#,##0")&" million people while the West adds only "&TEXT(WEST_POP_2050-WEST_POP,"#,##0")&" million. Median age: Africa "&${PP}B12&" vs West "&${PP}C12&" — a young, mobile-first customer base for decades."`,
    `="💰  These ${n} Western firms earn ~$"&TEXT(${GF}H${tot},"#,##0")&" bn a year in the West. Adjusted for Africa's population, income and internet reach, the same models are worth ~$"&TEXT(${AP}H${tot},"#,##0")&" bn a year in Africa today and ~$"&TEXT(${AP}J${tot},"#,##0")&" bn a year by 2050 (base case)."`,
    `="🚀  Biggest opportunity: the "&O16&" model — ~$"&TEXT(P16,"#,##0.0")&" bn/yr in Africa by 2050. One African startup winning "&TEXT(MKT_SHARE,"0%")&" of it would earn ~$"&TEXT(P16*MKT_SHARE,"#,##0.0")&" bn/yr and could be worth ~$"&TEXT(P16*MKT_SHARE*VAL_MULT,"#,##0.0")&" bn."`
  ];
  insights.forEach((f, i) => {
    const r = 9 + i;
    sh.getRange(r, 2, 1, 12).merge().setFormula(f).setWrap(true).setVerticalAlignment('middle')
      .setBackground(i % 2 ? COLORS.white : COLORS.greyLight).setFontSize(10);
    sh.setRowHeight(r, 36);
  });

  /* Charts */
  sh.getRange('B16:M16').merge().setValue('CHARTS').setFontWeight('bold').setFontColor(COLORS.white).setBackground(COLORS.dark);
  const W = 560, H = 320;
  chart_(sh, Charts.ChartType.COLUMN, [sh.getRange('O7:Q11')], 17, 2, {
    title: 'Africa vs the West — people & internet users (millions)', colors: [COLORS.green, COLORS.blue],
    width: W, height: H, legend: { position: 'bottom' }
  });
  chart_(sh, Charts.ChartType.BAR, [sh.getRange('O15:P25')], 17, 8, {
    title: 'Top 10 business models for Africa — base 2050 (USD bn/yr)', colors: [COLORS.gold],
    width: W, height: H, legend: { position: 'none' }
  });
  chart_(sh, Charts.ChartType.PIE, [sh.getRange(29, 15, sectors.length + 1, 2)], 34, 2, {
    title: 'Where the value is — by sector (base 2050)', pieHole: 0.45,
    colors: [COLORS.green, COLORS.gold, COLORS.blue, '#C2410C', '#7C3AED', '#0891B2', COLORS.grey, '#65A30D'],
    width: W, height: H, legend: { position: 'right' }
  });
  chart_(sh, Charts.ChartType.COLUMN, [sh.getRange(scenRow + 1, 15, 5, 2)], 34, 8, {
    title: 'Total yearly revenue potential in Africa (USD bn)', colors: [COLORS.green],
    width: W, height: H, legend: { position: 'none' }
  });
  chart_(sh, Charts.ChartType.LINE, [sh.getRange(trajRow + 1, 15, TRAJECTORY.length + 1, 3)], 51, 2, {
    title: 'Population 1950 – 2100: Africa vs the West (millions)', colors: [COLORS.green, COLORS.blue],
    width: W, height: H, legend: { position: 'bottom' }, pointSize: 5, curveType: 'function'
  });
  chart_(sh, Charts.ChartType.BAR, [sh.getRange(onRow + 1, 15, 13, 3)], 51, 8, {
    title: 'Internet users by country (millions)', colors: [COLORS.green, COLORS.blue],
    width: W, height: H, legend: { position: 'bottom' }, isStacked: true
  });

  sh.getRange('B68:M68').merge()
    .setValue('Estimates for illustration only, not investment advice. Sources: company annual reports (FY2024), UN World Population Prospects 2024, ITU, IMF WEO. See "Read Me" for the method.')
    .setFontStyle('italic').setFontSize(8).setFontColor('#52606D').setWrap(true);
  sh.setFrozenRows(2);
}

/* --------------------------- Read Me -------------------------------------- */

function buildReadMe_(ss) {
  const sh = resetSheet_(ss, SHEETS.README);
  title_(sh, 'A1:A1', 'A2:A2', '📖 Read Me — method, sources, caveats', 'How the numbers are built, so you can explain and defend them.');
  const lines = [
    ['THE IDEA'],
    ['Western tech giants built huge businesses on simple models: marketplaces, payments, ads, streaming, ride-hailing, cloud. Africa has more people than the whole West, is younger, and is coming online fast. This workbook estimates what the same models could be worth in Africa.'],
    [''],
    ['THE METHOD (per company)'],
    ['1. Revenue from the West = global revenue × estimated share earned in USA, Canada, EU and UK.'],
    ['2. Spend per Western person = revenue from the West ÷ Western population.'],
    ['3. Spend per Western internet user = step 2 ÷ share of Westerners online.'],
    ['4. Africa potential = spend per internet user × Africans online × affordability factor × scenario multiplier.'],
    ['   • Affordability factor = African income per person ÷ Western income per person (Africans spend less in dollars).'],
    ['   • Scenarios: Conservative 0.5×, Base 1×, Bull 2.5× (≈ purchasing-power view + mobile-first leapfrogging).'],
    ['5. 2050 = same logic with Africa\'s 2050 population, internet reach and income (in 2024 dollars).'],
    ['6. Market value = yearly revenue × valuation multiple. "One startup" = market × your target market share.'],
    [''],
    ['HOW TO USE'],
    ['• Change yellow cells on "Assumptions" (population, internet, income, scenarios, valuation, market share).'],
    ['• Change yellow revenue / West-share cells on "Global Firms", or population / internet cells on "Population".'],
    ['• Menu 🌍 Africa Tech ▸ Build / rebuild re-draws everything and keeps your Assumptions and firm numbers.'],
    ['• If numbers or text look odd, set File ▸ Settings ▸ Locale to "United States" or "United Kingdom".'],
    [''],
    ['CAVEATS'],
    ['• All figures are rounded public estimates. Verify before using them in a pitch or investment decision.'],
    ['• Totals add up different markets that overlap (e.g. Meta and Google both sell ads) — read the total as "size of the prize", not one market.'],
    ['• Some Western firms already earn money in Africa; the model shows the potential for African-built alternatives, not untouched space.'],
    [''],
    ['SOURCES'],
    ['Company annual reports / 10-K filings FY2024 · UN World Population Prospects 2024 · ITU Facts & Figures · IMF World Economic Outlook · DataReportal · Public funding announcements for African startups.']
  ];
  sh.getRange(4, 1, lines.length, 1).setValues(lines).setWrap(true).setVerticalAlignment('top');
  lines.forEach((l, i) => {
    if (/^[A-Z ()]+$/.test(l[0]) && l[0].trim()) sh.getRange(4 + i, 1).setFontWeight('bold').setFontColor(COLORS.green).setFontSize(12);
  });
  sh.setColumnWidth(1, 900);
}

/* ============================== HELPERS ==================================== */

function resetSheet_(ss, name) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  sh.getCharts().forEach(c => sh.removeChart(c));
  sh.getBandings().forEach(b => b.remove());
  sh.setFrozenRows(0); sh.setFrozenColumns(0);
  sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns()).breakApart();
  sh.clear();
  sh.setConditionalFormatRules([]);
  sh.setHiddenGridlines(true);
  sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns()).setFontFamily('Arial');
  return sh;
}

function title_(sh, titleA1, subA1, text, sub) {
  sh.getRange(titleA1).merge().setValue(text).setFontSize(18).setFontWeight('bold')
    .setFontColor(COLORS.white).setBackground(COLORS.green).setVerticalAlignment('middle');
  sh.getRange(subA1).merge().setValue(sub).setFontStyle('italic').setFontColor(COLORS.dark)
    .setBackground(COLORS.greenLight).setWrap(true).setVerticalAlignment('middle');
  sh.setRowHeight(1, 46);
  sh.setRowHeight(2, 38);
}

function header_(range) {
  return range.setBackground(COLORS.dark).setFontColor(COLORS.white).setFontWeight('bold')
    .setWrap(true).setVerticalAlignment('middle').setHorizontalAlignment('center');
}

function total_(range) {
  range.setBackground(COLORS.goldLight).setFontWeight('bold')
    .setBorder(true, null, null, null, null, null, COLORS.dark, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
}

function zebra_(range) {
  const rows = range.getNumRows(), cols = range.getNumColumns();
  const bg = [];
  for (let r = 0; r < rows; r++) bg.push(Array(cols).fill(r % 2 ? COLORS.greyLight : COLORS.white));
  range.setBackgrounds(bg);
}

/** Small titled data table on the Dashboard (column O onwards). */
function block_(sh, row, label, headers, rows, fmt) {
  sh.getRange(row, 15).setValue(label).setFontWeight('bold').setFontColor(COLORS.green);
  sh.getRange(row + 1, 15, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground(COLORS.greyLight);
  if (rows) {
    sh.getRange(row + 2, 15, rows.length, rows[0].length).setValues(rows);
    if (rows[0].length > 1) sh.getRange(row + 2, 16, rows.length, rows[0].length - 1).setNumberFormat(fmt);
  }
}

function chart_(sh, type, ranges, row, col, options) {
  let b = sh.newChart().setChartType(type).setPosition(row, col, 0, 0).setNumHeaders(1);
  ranges.forEach(r => { b = b.addRange(r); });
  Object.keys(options).forEach(k => { b = b.setOption(k, options[k]); });
  b = b.setOption('titleTextStyle', { fontSize: 13, bold: true, color: COLORS.dark })
       .setOption('backgroundColor', COLORS.white);
  sh.insertChart(b.build());
}

function setName_(ss, name, range) {
  try { ss.removeNamedRange(name); } catch (e) { /* not there yet */ }
  ss.setNamedRange(name, range);
}
