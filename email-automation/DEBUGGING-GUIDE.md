# 🔧 Email Automation System - Debugging Guide

## Quick Troubleshooting

### Issue: "Emails show as sent but aren't actually delivering"

This is the most common issue. Here's how to diagnose it:

#### Step 1: Run the System Test
1. Open your Google Sheet
2. Go to menu: **📧 Email Automation → 🧪 Test System**
3. This will attempt to send a test email to the first contact in your list
4. You should see a dialog with the result

#### Step 2: Check the Apps Script Logs
If the test failed or you're not sure about the result:

1. Open the Apps Script Editor
   - In Google Sheets: **Extensions → Apps Script**
   - Or go to: https://script.google.com

2. Click on the clock icon (Executions) or press **Ctrl+Enter** to view logs

3. Look for messages with these prefixes:
   - `[SEND]` - Single email send details
   - `[SEND_BULK]` - Bulk send progress
   - `[TEST]` - Diagnostic test output

#### Step 3: Interpret the Log Messages

**Good example** - Email was sent successfully:
```
[SEND] Starting sendEmail: to=alice@example.com, template=general-update, business=default
[SEND] Business loaded: Your Business Name, Template loaded
[SEND] Template HTML length: 4532 characters
[SEND] Replaced placeholder {{firstName}}
[SEND] Final HTML length: 4521 characters
[SEND] Attempting to call GmailApp.sendEmail()
[SEND] ✓ GmailApp.sendEmail() completed without exception
[SEND] ✓ Email sent successfully to alice@example.com
```

**Problem example** - Email validation failed:
```
[SEND] Starting sendEmail: to=not-an-email, template=general-update, business=default
[SEND] Email validation failed: Invalid email format
```

**Problem example** - Template not found:
```
[SEND] Starting sendEmail: to=alice@example.com, template=wrong-name, business=default
[SEND] Template not found: wrong-name
```

**Problem example** - GmailApp threw an exception:
```
[SEND] Attempting to call GmailApp.sendEmail()
[SEND] ✗ GmailApp.sendEmail() threw exception: Exception: Access to GmailApp has not been granted
```

---

## Common Issues and Solutions

### 1. "No valid recipients found"

**What it means:** The system couldn't find any contacts to email.

**Checklist:**
- [ ] Do you have at least one contact added in the "Contacts" sheet?
- [ ] Is the email address in a valid format (contains @)?
- [ ] If using "Active Only" recipient mode, are the contacts marked with "Y" in the Active column?
- [ ] If using a specific group or tag, do your contacts have those assigned?

**Solution:**
1. Open the "👥 Contacts" sheet
2. Check that you have at least one contact with a valid email
3. Make sure they're marked "Y" in the Active column
4. Try using "All Contacts" recipient mode (not "Active Only")

### 2. "Access to GmailApp has not been granted"

**What it means:** Google Apps Script doesn't have permission to send emails.

**Solution:**
1. Run the diagnostic test again: **📧 Email Automation → 🧪 Test System**
2. Google will prompt you to authorize the script
3. Click "Review Permissions" → "Allow"
4. Try sending again

This usually only happens once, when you first use the script.

### 3. "Template not found"

**What it means:** The template you selected doesn't exist in the system.

**Solution:**
1. Open the Compose dialog: **📧 Email Automation → ✉️ Compose & Send**
2. Click the "Template" dropdown - you should see available templates
3. Select one of the available templates
4. Make sure it's not a custom template that was deleted

### 4. Emails sent but recipients say they never received them

**Checklist:**
- [ ] Check spam/junk folder
- [ ] Make sure Gmail has permission to send from your account
- [ ] Verify your "Business Email" in the script is the correct sender address
- [ ] Check that the email HTML is valid (no script errors)

**To check HTML validity:**
1. Look at the App Script logs
2. See if you see: `[SEND] ✓ GmailApp.sendEmail() completed without exception`
3. If yes, the HTML was accepted, but Gmail might be filtering it

---

## Understanding the Log Tags

### [SEND] - Single Email Processing

Shows detailed information about sending one email:
- Email address being processed
- Template and business configuration
- Placeholder replacements
- GmailApp call result

**Important lines:**
- `[SEND] ✓ GmailApp.sendEmail() completed without exception` = email was accepted by Gmail
- `[SEND] ✓ Email sent successfully` = no errors detected

### [SEND_BULK] - Bulk Send Progress

Shows progress of sending multiple emails:
- Total recipients found
- Progress for each email (1/50, 2/50, etc.)
- Success/failure for each recipient
- Final summary

**Example:**
```
[SEND_BULK] Starting bulk send: mode=active, group=, tag=
[SEND_BULK] Recipients resolved: 3 total
[SEND_BULK] Beginning to send 3 emails...
[SEND_BULK] Processing recipient 1/3: alice@example.com
[SEND_BULK]   ✓ Success
[SEND_BULK] Processing recipient 2/3: bob@example.com
[SEND_BULK]   ✓ Success
[SEND_BULK] Processing recipient 3/3: carol@example.com
[SEND_BULK]   ✗ Failed: Invalid email format
[SEND_BULK] ✓ Bulk send complete: 2 sent, 1 failed
```

### [TEST] - Diagnostic Test Output

Shows results from the system test:
- Contacts sheet validation
- Test email send attempt
- Success or failure details

---

## How to Enable Detailed Logging

The system already logs to Apps Script automatically. To see logs:

1. Open **Extensions → Apps Script**
2. Press **Ctrl+Enter** (Windows) or **Cmd+Enter** (Mac)
3. Look for the Executions tab to see recent runs
4. Click on an execution to see its logs

You can also manually trigger a run to see fresh logs:
- Use the 🧪 Test System menu item
- Or click the Play button in Apps Script Editor

---

## When to Check the Logs

**Always check logs if:**
- Emails aren't being delivered
- You see an error message in the compose dialog
- You want to verify what happened after sending
- The system seems to hang or freeze

**The logs are permanent** in the Apps Script Executions tab, so you can review them later.

---

## Performance Notes

- Emails are sent with a 100ms delay between each one (prevents hitting Gmail rate limits)
- For 100 emails, expect ~10 seconds total time
- The system logs every email, so you can track exactly which ones succeeded/failed
- Large HTML templates (>10KB) may take longer to process

---

## Still Having Issues?

1. **Collect diagnostic information:**
   - Screenshot of the error message
   - Apps Script logs (copy and paste relevant lines)
   - The recipient mode you were using (All, Active, Group, Tag, Manual)
   - The template name

2. **Check the Error Log sheet:**
   - Open the "📋 Email Log" sheet
   - Look for entries marked with "❌ Failed"
   - The "Status" column shows why each email failed

3. **Test with manual email entry:**
   - Try sending to a single email address using "Manual Email Entry" mode
   - This helps isolate whether the issue is with recipient selection or email sending itself
