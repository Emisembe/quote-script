# 📊 Email Logging & Multi-Sheet Import Guide

**Advanced features for tracking emails and managing multiple customer sources**

---

## What's New

### ✨ Feature 1: Multi-Sheet Import
Import customers from **multiple sheets at once** and combine them into one list!

### ✨ Feature 2: Automatic Email Logging
Every email you send is **automatically logged** in a dedicated sheet.

### ✨ Feature 3: Email Quota Dashboard
See **how many emails you can still send today** with a visual progress bar.

---

## Installation

Use the **advanced version** instead of the basic one:

1. Open Google Sheets
2. Go to **Extensions → Apps Script**
3. Delete existing code
4. Copy-paste from: `google-apps-script-with-logging.js`
5. Click **Save**
6. Refresh Google Sheets

That's it! Now you have all the new features.

---

## 🎯 Feature 1: Multi-Sheet Import

### Why This Is Useful

You might have customer data spread across multiple sheets:
- "Prospects" sheet
- "Hot Leads" sheet  
- "VIP Clients" sheet

Instead of importing one at a time, import ALL at once!

### How to Use It

1. Click **📧 Email Tools → 📋 Import from Sheets**

2. You get **two tabs**:
   - **Single Sheet** - Import from one sheet (original way)
   - **Multiple Sheets** - NEW! Import from many sheets

3. Click **Multiple Sheets** tab

4. You see **checkboxes for each sheet**:
   ```
   ☐ Prospects
   ☐ Hot Leads
   ☐ VIP Clients
   ☑ Active Customers    ← Check the ones you want
   ```

5. Check the sheets you want to combine

6. Set the column names:
   - "Email" (or whatever column has emails)
   - "First Name" (or whatever has names)

7. Click **📥 Import All Selected Sheets**

8. ✅ All customers from all sheets are combined!

### Example

You have:
- **Sheet A:** 50 customers
- **Sheet B:** 30 customers  
- **Sheet C:** 20 customers

Import all 3 at once → You get **100 customers** combined into one importedData list!

---

## 📊 Feature 2: Automatic Email Logging

### What Gets Logged?

Every time you send an email, this info is automatically saved:

| Column | Example | What It Means |
|--------|---------|---------------|
| Timestamp | 5/28/2026 3:45 PM | When email was sent |
| Recipient Email | john@example.com | Who got the email |
| First Name | John | Customer name |
| Template | quote-sent | Which template was used |
| Business | default | Which business sent it |
| Subject | Your Quote is Ready | Email subject line |
| Status | ✅ Sent | Did it send successfully? |
| Error Message | (blank) | If failed, why? |
| Sheet Source | Prospects | Which sheet they came from |

### Where Are The Logs?

The logs are saved in a **new sheet automatically created** called:

📊 **"📊 Email Logs"**

You can see it as a tab at the bottom of your spreadsheet.

### View The Logs

1. Click **📧 Email Tools → 📋 View Email Logs**
2. A dialog tells you: "✅ Email logs sheet created/opened!"
3. Go to the **"📊 Email Logs"** sheet tab
4. See all your sent emails

### Log Example

```
Timestamp          | Recipient       | First Name | Template    | Business | Status
5/28/2026 2:30 PM | john@example... | John       | quote-sent  | default  | ✅ Sent
5/28/2026 2:35 PM | jane@example... | Jane       | quote-sent  | default  | ✅ Sent
5/28/2026 2:40 PM | bob@example...  | Bob        | follow-up   | default  | ✅ Sent
5/28/2026 3:00 PM | evil@spam...    | Spam List  | quote-sent  | default  | ❌ Failed
```

---

## 📊 Feature 3: Email Quota Dashboard

### What Is Email Quota?

Gmail has a **daily limit** on how many emails you can send:

- **Regular Gmail Account:** 500 emails/day
- **Google Workspace:** 10,000+ emails/day

After you hit the limit, you can't send more emails until **tomorrow at midnight**.

### View Your Dashboard

1. Click **📧 Email Tools → 📊 Email Stats Dashboard**

2. You see something like:

```
📊 Email Statistics Dashboard

Today's Email Activity
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Emails Sent:          47
Emails Failed:        2
Daily Limit:          500
Remaining Quota:      453 emails

Usage Progress
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[████░░░░░░░░░░░░░░░░░░░░░] 9%

You've used 9% of your daily quota

ℹ️ Email Quota Info
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Regular Gmail Accounts: 500 emails/day
Google Workspace: 10,000+ emails/day
Reset Time: Midnight (your timezone)
```

### What The Dashboard Shows

| Item | Meaning |
|------|---------|
| **Emails Sent** | How many emails sent today |
| **Emails Failed** | How many failed to send |
| **Daily Limit** | Maximum you can send today |
| **Remaining Quota** | How many more you CAN send today |
| **Usage Progress Bar** | Visual: how much of your quota used |

### Real World Example

```
Today at 2:00 PM:
- Sent: 100 emails
- Remaining: 400 emails
- You can send 400 more before midnight!

Today at 11:00 PM:
- Sent: 480 emails
- Remaining: 20 emails
- ⚠️ WARNING: Only 20 emails left! (9%)
- Better wait until midnight to send more
```

---

## New Menu Items

When you have the advanced version, your menu looks like:

```
📧 Email Tools
├─ ⚙️ Setup Business Info
├─ 📋 Import from Sheets          ← NEW! Multi-sheet support
├─ ✉️ Send Email
├─ 🎨 Manage Templates
├─ ─────────────────────
├─ 📊 Email Stats Dashboard       ← NEW! See quota usage
├─ 📋 View Email Logs             ← NEW! See sent emails
├─ 📧 View Businesses
└─ 📧 View Templates
```

---

## 🔍 Real Example Workflow

### Scenario:
You have 3 sheets with prospects:
- "Q2 Prospects" = 50 people
- "Warm Leads" = 30 people
- "Follow-ups" = 20 people

You want to send quotes to all 100!

### Steps:

**Step 1: Import All**
1. Click **📧 Email Tools → 📋 Import from Sheets**
2. Click **Multiple Sheets** tab
3. Check: Q2 Prospects, Warm Leads, Follow-ups
4. Click **📥 Import All Selected Sheets**
5. Result: "✅ Imported 100 customers!"

**Step 2: Check Your Quota**
1. Click **📧 Email Tools → 📊 Email Stats Dashboard**
2. See: "Remaining Quota: 500 emails" (plenty!)

**Step 3: Send Emails**
1. Click **📧 Email Tools → ✉️ Send Email**
2. Pick Customer #1 → Send
3. ✅ Logged automatically!
4. Pick Customer #2 → Send
5. ✅ Logged automatically!
6. ... continue for all customers ...

**Step 4: Check Logs**
1. Click **📧 Email Tools → 📋 View Email Logs**
2. Go to "📊 Email Logs" sheet
3. See all 100 emails listed with timestamps

**Step 5: Monitor Quota**
1. After sending 50 emails, check dashboard again
2. See: "Remaining Quota: 450 emails"
3. Continue sending!

---

## 📋 What Information Is Stored In Logs?

When an email is sent (or fails), these details are logged:

```
✅ Success Example:
Timestamp:     5/28/2026 2:30 PM
Recipient:     john@example.com
First Name:    John
Template:      quote-sent
Business:      default
Subject:       Your Quote is Ready!
Status:        ✅ Sent
Error:         (blank - no error)
Sheet Source:  Prospects

❌ Failure Example:
Timestamp:     5/28/2026 2:35 PM
Recipient:     (invalid-email)
First Name:    BadData
Template:      quote-sent
Business:      default
Subject:       Your Quote is Ready!
Status:        ❌ Failed
Error:         Invalid email address
Sheet Source:  Test
```

---

## 💡 Tips & Best Practices

### Tip 1: Check Quota Before Big Campaigns
If you're sending 300 emails, check the dashboard first:
- Morning: 500 available? ✅ Go ahead!
- Evening: 200 available? ❌ Wait until midnight

### Tip 2: Use Sheet Source Column
The "Sheet Source" column shows which sheet each customer came from:
- "Prospects" = didn't convert yet
- "Hot Leads" = probably will buy
- "VIP" = very important!

This helps you track which groups responded best!

### Tip 3: Review Failed Emails
Filter the log sheet to show only "❌ Failed":
- See which emails had problems
- Check the error messages
- Try sending again manually

### Tip 4: Archive Old Logs
The logs sheet will get long over time. You can:
- Copy old rows to a backup sheet
- Delete rows older than 30 days
- Keep only current month's data

---

## Troubleshooting

### ❓ I imported sheets but don't see customers
→ Make sure column names match exactly (case-sensitive)
→ "Email" not "email" or "EMAIL"

### ❓ The logs sheet doesn't appear
→ It's created automatically - check sheet tabs at bottom
→ If not there, click "View Email Logs" to create it

### ❓ My quota shows 0 remaining!
→ You hit your daily limit
→ Wait until midnight for quota to reset
→ Or upgrade to Google Workspace for higher limits

### ❓ Can I change the daily quota limit?
→ The quota is set by Google (not by us)
→ Regular accounts = 500/day
→ Workspace accounts = 10,000+/day
→ Only way to increase: get Google Workspace

### ❓ Emails aren't being logged
→ Logs are created automatically
→ Check the "📊 Email Logs" sheet tab
→ Make sure you're using the advanced version

---

## Summary

✅ **Multi-Sheet Import:** Combine customers from multiple sheets  
✅ **Auto Logging:** Every email automatically tracked  
✅ **Quota Dashboard:** See how many emails you have left  
✅ **No Manual Tracking:** Everything happens in the background  

You now have a **professional email campaign system**! 🎉
