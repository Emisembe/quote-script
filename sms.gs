// ─── CONFIG ────────────────────────────────────────────────────────────────
// Name of the sheet tab containing your contacts
const SHEET_NAME = 'Contacts';

// SMS message template.
// Use {{FieldName}} to insert any column value from the sheet.
// Example columns: Name, Phone, Carrier, City, Amount, AppointmentDate
const MESSAGE_TEMPLATE = `Hi {{Name}}, this is a reminder from Acme Co.
Your appointment is on {{AppointmentDate}} at {{City}}.
Reply STOP to opt out.`;

// Carrier email-to-SMS gateways (add more as needed)
const CARRIER_GATEWAYS = {
  'att':       'txt.att.net',
  'tmobile':   'tmomail.net',
  'verizon':   'vtext.com',
  'sprint':    'messaging.sprintpcs.com',
  'cricket':   'sms.cricketwireless.net',
  'boost':     'sms.myboostmobile.com',
  'metropcs':  'mymetropcs.com',
  'uscellular':'email.uscc.net',
  'virgin':    'vmobl.com',
};

// Column header names (must match your sheet exactly, case-insensitive)
const PHONE_COL    = 'Phone';    // 10-digit US number, digits only
const CARRIER_COL  = 'Carrier';  // Must match a key in CARRIER_GATEWAYS
const STATUS_COL   = 'Status';   // Script writes "Sent" or error here

// ─── MAIN ───────────────────────────────────────────────────────────────────
function sendBulkSMS() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error(`Sheet "${SHEET_NAME}" not found.`);

  const [headers, ...rows] = sheet.getDataRange().getValues();
  const idx = buildIndex(headers);

  requireColumns(idx, [PHONE_COL, CARRIER_COL]);

  const statusCol = idx[normalize(STATUS_COL)];

  rows.forEach((row, i) => {
    const rowNum = i + 2; // 1-based + header row
    const status = statusCol !== undefined ? String(row[statusCol]).trim() : '';

    // Skip rows already sent
    if (status.toLowerCase() === 'sent') return;

    const phone   = String(row[idx[normalize(PHONE_COL)]]  || '').replace(/\D/g, '');
    const carrier = String(row[idx[normalize(CARRIER_COL)]] || '').trim().toLowerCase();

    if (!phone || phone.length < 10) {
      writeStatus(sheet, rowNum, statusCol, 'Skipped: invalid phone');
      return;
    }

    const gateway = CARRIER_GATEWAYS[carrier];
    if (!gateway) {
      writeStatus(sheet, rowNum, statusCol, `Skipped: unknown carrier "${carrier}"`);
      return;
    }

    const message = buildMessage(MESSAGE_TEMPLATE, headers, row, idx);
    const address = `${phone}@${gateway}`;

    try {
      GmailApp.sendEmail(address, '', message);
      writeStatus(sheet, rowNum, statusCol, 'Sent');
      Logger.log(`Sent to ${address}`);
    } catch (e) {
      writeStatus(sheet, rowNum, statusCol, `Error: ${e.message}`);
      Logger.log(`Failed for row ${rowNum}: ${e.message}`);
    }
  });

  Logger.log('Done.');
}

// ─── HELPERS ────────────────────────────────────────────────────────────────

// Replace {{ColumnName}} placeholders with the row's values
function buildMessage(template, headers, row, idx) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const colIdx = idx[normalize(key)];
    return colIdx !== undefined ? String(row[colIdx] ?? '') : `{{${key}}}`;
  });
}

// Build a lowercase-keyed map of header -> column index
function buildIndex(headers) {
  const map = {};
  headers.forEach((h, i) => { map[normalize(h)] = i; });
  return map;
}

function normalize(str) {
  return String(str).trim().toLowerCase().replace(/\s+/g, '');
}

function requireColumns(idx, names) {
  names.forEach(name => {
    if (idx[normalize(name)] === undefined)
      throw new Error(`Required column "${name}" not found in sheet.`);
  });
}

// Write status back to the sheet; adds the column header if it doesn't exist
function writeStatus(sheet, rowNum, colIdx, value) {
  if (colIdx === undefined) return;
  sheet.getRange(rowNum, colIdx + 1).setValue(value);
}
