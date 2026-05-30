# ✅ Email Automation System - Complete Testing Guide

This guide walks you through testing every feature of the Email Automation System. Follow the steps in order to ensure everything is working correctly.

## Prerequisites

Before testing, ensure:
- [ ] Google Sheet is open with the Email Automation script installed
- [ ] You can see the **📧 Email Automation** menu
- [ ] You have at least one contact in the Contacts sheet
- [ ] You have access to your email to receive test messages

---

## Test 1: System Diagnostic (5 minutes)

**Purpose:** Verify the core system is working and can send emails.

### Steps:

1. Click **📧 Email Automation → 🧪 Test System**
2. Wait for the dialog to appear
3. Look at the result:
   - ✅ If it says "Success!" - The system is working! Check your email for the test message.
   - ❌ If it shows an error - Review the troubleshooting steps in the dialog and the DEBUGGING-GUIDE.md

### Expected Outcome:
- You receive a test email with the subject "🧪 Email Automation System Test"
- The email contains personalized greeting with your first contact's name
- The email displays properly formatted HTML

### If test failed:
- Check the Apps Script Logs (Extensions → Apps Script, then Ctrl+Enter)
- Look for `[TEST]` log messages to identify the issue
- See DEBUGGING-GUIDE.md for solutions

---

## Test 2: Single Email Send (5 minutes)

**Purpose:** Test sending a single email through the compose dialog.

### Steps:

1. Click **📧 Email Automation → ✉️ Compose & Send**
2. Fill in the form:
   - **Template:** Select "general-update"
   - **Business:** "default" (should be pre-selected)
   - **Subject:** "Test Email from Automation System"
   - **Headline:** "Hello {{firstName}}!"
   - **Main Message:** "This is a test email to verify the system is working correctly."
   - **Recipient Mode:** "All Contacts"
   - **Send Now** button should be visible at the bottom

3. Scroll down and click **✉️ Send Now**
4. Wait for the response (should say "✅ Sent to X recipients")
5. Check your email inbox for the test message

### Expected Outcome:
- You see "✅ Sent to [number] recipients" message
- Email arrives with subject "Test Email from Automation System"
- The email shows "Hello [Your Name]!" in the heading
- The custom message appears in the email body

### If it didn't work:
- Check that you selected "All Contacts" mode (should show contact count)
- Verify your Contacts sheet has at least one active contact (marked with "Y")
- Check Apps Script Logs for [SEND] errors
- See DEBUGGING-GUIDE.md section "Emails sent but recipients say they never received them"

---

## Test 3: Recipient Selection Modes (3 minutes each)

**Purpose:** Test all five recipient selection modes work correctly.

### Test 3a: Active Only Mode

1. Open **Compose & Send** dialog again
2. For **Recipient Mode**, select: "Active Only"
3. Set other fields:
   - Template: "general-update"
   - Subject: "Test: Active Only Mode"
   - Main Message: "If you see this, you are marked as Active."
4. Click **✉️ Send Now**
5. Check if it matches the number of contacts marked "Y" in Active column

### Test 3b: All Contacts Mode

1. Ensure some contacts have "N" in Active column
2. Select **Recipient Mode**: "All Contacts"
3. Fill other fields, send
4. Should send to ALL contacts, including inactive ones

### Test 3c: Group Mode

1. Make sure at least two contacts have the same group (e.g., "Members")
2. Select **Recipient Mode**: "Group"
3. Select the group name from dropdown
4. Fill fields, send
5. Should only send to contacts in that group

### Test 3d: Tag Mode

1. Make sure some contacts have tags (comma-separated values in Tags column)
2. Select **Recipient Mode**: "Tag"
3. Select a tag from dropdown
4. Fill fields, send
5. Should only send to contacts with that tag

### Test 3e: Manual Email Entry

1. Select **Recipient Mode**: "Manual Email Entry"
2. Instead of dropdowns, a text area appears for entering emails
3. Enter email addresses separated by commas or newlines
4. Example: `alice@example.com, bob@example.com`
5. Fill other fields, send
6. Should send only to the emails you entered

### Expected Outcome for All Tests:
- ✅ Recipient count matches your expectations
- ✅ Emails are sent to the correct people
- ✅ Email Log shows the correct number of emails sent

---

## Test 4: Payment Reminder Templates (5 minutes)

**Purpose:** Test all three payment reminder templates.

### Test 4a: Friendly Reminder (Blue)

1. Open **Compose & Send** dialog
2. **Template:** "payment-reminder-friendly"
3. **Subject:** "Payment Reminder - Invoice #INV001"
4. Set these fields:
   - Invoice Number: "INV001"
   - Amount: "$500.00"
   - Due Date: "2024-06-30"
   - Custom Message: "(Optional) Thank you for your prompt attention to this matter."
   - Payment URL: "https://payment.example.com/INV001"
   - Recipient Mode: "Manual Email Entry"
   - Manual Emails: Your own email address for testing

5. Click **✉️ Send Now**
6. Check your email

### Expected Outcome:
- Email has **blue header** with "Payment Reminder"
- Shows **friendly tone**: "Thank you for your business"
- Displays invoice info in a blue info box
- Has a "💳 Make Payment" button
- If you added custom message, it appears in the email

### Test 4b: Urgent Reminder (Orange)

1. Use template: "payment-reminder-urgent"
2. **Subject:** "URGENT: Overdue Payment - Invoice #INV001"
3. This time, also set:
   - Days Overdue: "5"
4. Send to your email

### Expected Outcome:
- Email has **orange header** with "⚠️ Urgent Payment Notice"
- Shows **warning tone**: "This is a second notice"
- **Days Overdue field** is displayed (showing "5")
- Has a "💳 Pay Now" button in orange
- Urgent language throughout

### Test 4c: Final Notice (Red)

1. Use template: "payment-reminder-final"
2. **Subject:** "FINAL NOTICE: Immediate Action Required"
3. Set:
   - Days Overdue: "15"
   - Custom Message: "Failure to pay within 48 hours will result in account suspension."
4. Send to your email

### Expected Outcome:
- Email has **red header** with "🚨 FINAL NOTICE"
- Shows **critical tone**: "This is our final notice"
- Displays **strong warning**: "Failure to settle... will result in further action"
- Has a "💳 Settle Payment Now" button in red
- 48-hour deadline is clearly stated

### If Templates Look Wrong:
- Check that {{placeholder}} values are being replaced
- If you see `{{invoiceNumber}}` in the email, placeholders aren't working
- See DEBUGGING-GUIDE.md section "Email validation failed"

---

## Test 5: Member Number Generator (2 minutes)

**Purpose:** Test the member number generation feature.

### Steps:

1. Click **📧 Email Automation → 🔢 Generate Member Numbers**
2. The dialog shows:
   - Prefix options: "MEM", "CUST", or "Custom"
   - Starting number
   - How many numbers to generate

3. Try this:
   - Select prefix: "MEM"
   - Starting number: "1"
   - Count: "5"
   - Click **Generate**

4. Open the Contacts sheet and look at the "Member / Customer No." column
5. You should see: MEM-0001, MEM-0002, MEM-0003, etc.

### Expected Outcome:
- [ ] Member numbers are generated in the correct column
- [ ] Format is correct (MEM-0001, not MEM1 or MEM001)
- [ ] Existing member numbers are not overwritten
- [ ] Numbers are only assigned to contacts that don't have one

### If Member Numbers Didn't Appear:
- Check the Contacts sheet (look at column F)
- If you see blank cells, the generator might need permission
- Check Apps Script Logs for errors

---

## Test 6: Bulk Send with Preview (3 minutes)

**Purpose:** Test bulk send with recipient preview.

### Steps:

1. Open **Compose & Send**
2. Select:
   - Template: "general-update"
   - Subject: "Bulk Test Message"
   - Headline: "Bulk Send Preview Test"
   - Main Message: "This tests the bulk send preview feature."
   - Recipient Mode: "All Contacts"

3. Before clicking Send, look for a **recipient count** that shows how many will receive the email

4. Click **✉️ Send Now**

5. You should see a message like: "✅ Sent to 3 recipients"

### Expected Outcome:
- System shows how many recipients BEFORE sending
- After send, confirms how many were actually sent
- The numbers should match (3 sent, 0 failed)

### If Numbers Don't Match:
- Some recipients may have invalid emails (missing @)
- Check the Email Log sheet for failed entries
- See DEBUGGING-GUIDE.md section "No valid recipients found"

---

## Test 7: Scheduled Email (5 minutes)

**Purpose:** Test email scheduling for future delivery.

### Steps:

1. Open **Compose & Send**
2. Fill in:
   - Template: "general-update"
   - Subject: "Scheduled Test Email"
   - Main Message: "This email was scheduled."
   - Recipient Mode: "Manual Email Entry"
   - Manual Emails: Your email address

3. Scroll down and click **📅 Schedule Email** button

4. Select a date/time **5 minutes in the future** (this ensures the trigger will fire during testing)

5. Click **✅ Schedule**

6. You should see: "✅ Scheduled for [date/time]"

7. Go to **📧 Email Automation → 📅 Scheduled Emails**

8. You should see your scheduled email listed

9. Wait for the scheduled time (or cancel and reschedule for 1 minute from now for faster testing)

### Expected Outcome:
- Email is listed in the Scheduled Emails manager
- Email arrives at the scheduled time
- Email Log shows the email was sent

### If Email Didn't Arrive:
- Check that you scheduled it for the future (not past time)
- Wait the full scheduled time
- The script needs to run at the scheduled time (trigger system)
- See DEBUGGING-GUIDE.md "Still Having Issues?" section

---

## Test 8: Personalization (3 minutes)

**Purpose:** Verify {{placeholder}} personalization works.

### Steps:

1. Open **Compose & Send**
2. Look for the **blue info box** under the Main Message field
3. It should show example placeholders you can use:
   - {{NAME}} - Full name
   - {{FIRST_NAME}} - First name
   - {{EMAIL}} - Email address
   - {{MEMBER_NO}} - Member number

4. Try this test:
   - Template: "general-update"
   - Subject: "Test Personalization"
   - Headline: "Hello {{FIRST_NAME}}!"
   - Main Message: "Dear {{NAME}}, your email is {{EMAIL}} and member number is {{MEMBER_NO}}."
   - Send to "All Contacts"

5. Check the received email

### Expected Outcome:
- Each person sees their own NAME, FIRST_NAME, EMAIL, MEMBER_NO
- Example: "Hello Alice! Dear Alice Johnson, your email is alice@example.com..."
- NOT showing: "Hello {{FIRST_NAME}}!" (that would mean placeholders didn't work)

### If Placeholders Aren't Working:
- Make sure you used double curly braces: `{{placeholder}}`
- Check that placeholder names match the available options
- See DEBUGGING-GUIDE.md section "Template not found"

---

## Test 9: Add Contact Dialog (2 minutes)

**Purpose:** Test adding and updating contacts.

### Steps:

1. Click **📧 Email Automation → 👤 Add Contact**
2. Add a new contact:
   - Name: "Test User"
   - Email: "test123@example.com"
   - Group: "Test"
   - Active: "Y"
   - Tags: "testing,temporary"
   - Member/Customer No: "TEST-001"

3. Click **✅ Add Contact**

4. Open the Contacts sheet and verify the new contact is there

5. Now update the same contact:
   - In the Add Contact dialog, enter the same email
   - Change Name to: "Test User Updated"
   - Click **✅ Add Contact**

6. Check the Contacts sheet

### Expected Outcome:
- New contact is added
- When you add the same email again, it **updates the existing entry** (doesn't create a duplicate)
- The sheet shows only one row for test123@example.com with the updated name

### If Duplicate Entries Appeared:
- This means the smart update feature isn't working
- Check the Contacts sheet for duplicate emails
- You may need to manually delete the duplicate

---

## Test 10: Email Log Review (2 minutes)

**Purpose:** Verify the audit trail is working.

### Steps:

1. Click **📧 Email Automation → 📋 View Email Log**
2. You should be taken to the "Email Log" sheet

3. Look at the entries:
   - **Timestamp:** When the email was sent
   - **Template:** Which template was used
   - **Subject:** The email subject
   - **Count:** Number of recipients (usually 1 or higher)
   - **Status:** ✅ Sent or ❌ Failed [reason]

4. Entries should show all your test emails from previous tests

### Expected Outcome:
- [ ] Log shows successful sends as "✅ Sent"
- [ ] Log shows failed sends as "❌ Failed: [reason]"
- [ ] Timestamps are accurate
- [ ] Templates match what you sent

### If Log is Empty:
- You haven't sent any emails yet
- Or the Email Log sheet wasn't created
- Run Test 1 (System Diagnostic) which logs an entry

---

## Quick Reference Checklist

Print this checklist and mark off each completed test:

```
CORE FUNCTIONALITY:
□ Test 1: System Diagnostic passes
□ Test 2: Single email sends successfully
□ Test 3a: Active Only mode works
□ Test 3b: All Contacts mode works
□ Test 3c: Group mode works
□ Test 3d: Tag mode works
□ Test 3e: Manual email entry works

TEMPLATES:
□ Test 4a: Friendly reminder looks correct
□ Test 4b: Urgent reminder has orange header
□ Test 4c: Final notice has red header

FEATURES:
□ Test 5: Member number generator works
□ Test 6: Bulk send preview shows correct count
□ Test 7: Scheduled emails arrive on time
□ Test 8: Placeholders are personalized correctly
□ Test 9: Add Contact updates existing entries

TRACKING:
□ Test 10: Email Log records all activity

SUCCESS:
□ All tests passed - System is production ready!
```

---

## Troubleshooting Quick Links

If a test fails, jump to the relevant section in DEBUGGING-GUIDE.md:

- **No emails received?** → Check "Issue: Emails show as sent but aren't actually delivering"
- **Recipients not found?** → Check "Common Issue #1: No valid recipients found"
- **Template errors?** → Check "Common Issue #3: Template not found"
- **Permission errors?** → Check "Common Issue #2: Access to GmailApp has not been granted"

---

## What to Do If Everything Passes

Congratulations! Your Email Automation System is fully functional. You can now:

1. **Add your real contacts** to the Contacts sheet
2. **Configure your business info** in the CONFIG section (if you haven't already)
3. **Create custom templates** or use the pre-built ones
4. **Set up automated workflows** by scheduling regular reminders
5. **Monitor email activity** in the Email Log sheet

Enjoy your new email automation system! 🎉
