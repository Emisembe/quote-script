# User Guide - Community Management System

## Quick Start

Once deployed, you'll see a new menu in your spreadsheet: **"Community Management"**

This menu contains all the tools for managing your organization. Here's how to use each feature:

---

## Menu Overview

```
Community Management
├─ 📝 Send Contribution Reminders
├─ 📧 Send Event Notifications
├─ ✅ Mark Payment as Paid
├─ 📊 Generate Payment Report
├─ 📆 Create New Year Sheet
├─ 🗂️ Archive Previous Year
├─ 🔄 Sync Member Records
├─ 🎫 Generate Member IDs
├─ 📧 Send Welcome Emails
└─ ⚙️ Setup & Documentation
```

---

## Common Tasks

### 1. Add a New Member

**Method A: Using the Registration Form (Recommended)**
1. Share the registration form link with the new member
2. They submit their information
3. System automatically:
   - Creates Members entry
   - Generates unique Member ID
   - Creates Contributions entry
   - Sends welcome email

**Method B: Manual Entry**
1. Go to **"Members"** sheet
2. Add a new row with:
   - Name, Phone, Email, Status (ACTIVE), Join Date, Group
3. Go to **"Community Management"** → **"Generate Member IDs"**
4. System generates ID for new member
5. New contribution entry will need to be added manually

### 2. Record a Payment

**Quick Method:**
1. Click **"Community Management"** → **"Mark Payment as Paid"**
2. Enter the Member ID
3. System will:
   - Mark payment as PAID
   - Update balance to 0
   - Send confirmation email

**Batch Method:**
1. Go to **"Payments"** sheet
2. Add rows with:
   - Member ID | Amount Paid | Payment Date
3. Leave Status column blank
4. Go to **"Community Management"** → any menu item (it triggers background processing)
5. System processes all unmarked payments

**Manual Method:**
1. Go to **"Contributions"** sheet
2. Find the member's row
3. Update:
   - **Amount Paid** = total paid amount
   - **Payment Status** = PAID/PARTIAL/UNPAID
   - **Payment Date** = today's date
   - **Balance** = Amount Due - Amount Paid

### 3. Send Contribution Reminders

1. Click **"Community Management"** → **"📝 Send Contribution Reminders"**
2. A dialog appears asking for status:
   - Type `UNPAID` to remind only unpaid members
   - Type `ALL` to remind all members
3. Click OK
4. System sends emails to matching members

**Email Includes:**
- Member's name
- Amount due
- Due date
- Payment instructions
- Treasurer contact

### 4. Send Event Notifications

1. Click **"Community Management"** → **"📧 Send Event Notifications"**
2. Fill in the form:
   - **Event Title:** Name of the event
   - **Event Date:** Select the date
   - **Event Time:** Select the time
   - **Event Details:** Description and agenda
   - **Send to:** Choose recipients
     - All Members
     - Paid Members Only
     - Unpaid Members Only
3. Click "Send Notifications"
4. System sends emails and logs the event

### 5. Generate Payment Report

1. Click **"Community Management"** → **"📊 Generate Payment Report"**
2. A popup shows:
   - Summary statistics (total members, paid, unpaid)
   - Breakdown by payment status
   - Outstanding balances
3. Print or screenshot as needed

**Report Shows:**
- ✓ Paid members (green)
- ✗ Unpaid members (red)
- ⚠ Partial payments (yellow)

### 6. Create New Year Sheet

At the beginning of each year:

1. Click **"Community Management"** → **"📆 Create New Year Sheet"**
2. System prompts to confirm
3. Creates new sheet named "Contributions_[YEAR]"
4. Automatically adds all active members
5. Ready for new contributions

**What's Created:**
- New sheet with template structure
- All ACTIVE members copied over
- Amount Due and Balance set to 0
- Ready for contributions to be set

### 7. Archive Previous Year

After year-end:

1. Click **"Community Management"** → **"🗂️ Archive Previous Year"**
2. Enter the year to archive (e.g., 2024)
3. System creates read-only archive:
   - Named: `Archive_2024`
   - Contains complete year's data
   - Moved to end of spreadsheet

**Use For:**
- Historical reference
- Audit trails
- Year-over-year comparison

### 8. Sync Member Records

Updates member information from form responses:

1. Click **"Community Management"** → **"🔄 Sync Member Records"**
2. System checks for new form submissions
3. Adds any new members not yet in the sheet
4. Avoids duplicates by checking emails

**When Needed:**
- If form submissions are lagging
- To import members from another list
- To reconcile data

### 9. Generate Member IDs

Creates missing Member IDs:

1. Click **"Community Management"** → **"🎫 Generate Member IDs"**
2. System scans Members sheet
3. Creates IDs for any members without one
4. Format: MEM-0001, MEM-0002, etc.

**When Needed:**
- After adding members manually
- If IDs get deleted
- System prompts if needed

### 10. Send Welcome Emails

Sends welcome emails to new members:

1. Click **"Community Management"** → **"📧 Send Welcome Emails"**
2. System finds members without welcome email sent
3. Sends personalized welcome emails
4. Marks as sent

**Email Includes:**
- Welcome message
- Member ID
- Next steps
- Contact information

---

## Automated Features

These run automatically without manual action:

### Daily Overdue Reminder Check (8:00 AM)
- Finds overdue unpaid contributions
- Sends urgent payment reminders
- Logs action

### Weekly Payment Report (Monday 9:00 AM)
- Generates comprehensive payment summary
- Sent to Admin Email in Settings
- Includes statistics and trends

### Batch Payment Processing (5:00 PM)
- Checks Payments sheet for new entries
- Updates Contributions sheet
- Marks as PROCESSED

### Form Submission Processing (On Submit)
- Automatically processes member registration forms
- Creates Members entry
- Generates Member ID
- Sends welcome email

---

## Data Entry Tips

### Member Phone Numbers
- Include country code: +254712345678
- Format: Use consistent format throughout

### Email Addresses
- Must be valid (system validates)
- Should be unique per member
- Used for all communications

### Payment Status Values
Keep these exact (case-sensitive):
- `PAID` - Full payment received
- `UNPAID` - No payment received
- `PARTIAL` - Partial payment received
- `OVERDUE` - Payment is late

### Member Status Values
- `ACTIVE` - Active member
- `INACTIVE` - Not currently active
- `SUSPENDED` - Membership suspended

### Dates
- Use MM/DD/YYYY format
- Or Google Sheets date picker

---

## Common Workflows

### Monthly Collection Workflow
1. **Start of Month:**
   - Click "Send Contribution Reminders" → "ALL"
   - Manually set contribution amounts in Contributions sheet

2. **During Month:**
   - Members make payments
   - You record via "Mark Payment as Paid"

3. **End of Month:**
   - Generate Payment Report
   - Email report to leadership
   - Update notes for unpaid members

4. **System Automatically:**
   - Sends daily overdue reminders
   - Generates weekly report
   - Processes batch payments

### Annual Cycle Workflow

**January:**
1. Review previous year archive
2. Create New Year Sheet for current year
3. Set contribution amounts

**Throughout Year:**
1. Send reminders regularly
2. Process payments
3. Send event notifications
4. Generate monthly reports

**December:**
1. Final payment collection
2. Generate annual report
3. Archive the year

**January (Next Year):**
1. Create new year sheet again
2. Repeat cycle

### Member Onboarding Workflow

1. **New member registers** via form
2. **System automatically:**
   - Adds to Members sheet
   - Generates Member ID
   - Creates contribution entry
   - Sends welcome email
3. **Treasurer:**
   - Verifies information
   - Sets contribution amount
4. **Member receives:**
   - Welcome email with ID
   - Payment instructions
   - Next steps

---

## Reports You Can Generate

### Payment Report
**When:** Anytime via menu
**Contains:** Member list with payment status
**Use:** Track collections, identify delinquent members

### Member List Report
**When:** Via Apps Script console
**Contains:** All member information
**Use:** Directory, contact list, audit

### Contribution Summary
**When:** Via Apps Script console
**Contains:** Contribution type breakdown
**Use:** Analysis by contribution type

### System Health Report
**When:** Via Apps Script console
**Contains:** System status, triggers, logs
**Use:** Troubleshooting, monitoring

---

## Email Templates Used by System

### Payment Reminder Email
Sent when:
- Manual reminder is sent
- Overdue payment is detected (daily)

Contains:
- Amount due
- Due date
- Payment instructions
- Treasurer contact

### Payment Confirmation Email
Sent when:
- Payment marked as PAID

Contains:
- Amount received
- Payment date
- New balance
- Thank you message

### Welcome Email
Sent when:
- New member registers
- Manual welcome emails sent

Contains:
- Warm welcome
- Member ID
- Next steps
- Treasurer contact

### Event Notification Email
Sent when:
- Event notification sent

Contains:
- Event title
- Date and time
- Event details
- RSVP information

---

## Settings Reference

Go to **Settings** sheet and configure:

| Setting | Example | Used For |
|---------|---------|----------|
| Organization Name | My Community | Email signatures, reports |
| Treasurer Email | treasurer@org.com | Payment inquiries |
| Payment Instructions | Bank: 123456789 | Payment reminder emails |
| Organization Description | We are a... | Welcome emails |
| Website URL | https://org.com | Email footer |
| Admin Email | admin@org.com | Weekly reports |
| Form URL | https://forms.google.com/... | Form processing |

---

## Troubleshooting

### Q: Email not appearing in recipient's inbox?
A: Check spam folder. First time emails may be flagged. Also verify email address in Members sheet is correct.

### Q: Member ID not generated?
A: Run "Generate Member IDs" from menu. Ensure member has a name and email.

### Q: Form not creating entries?
A: Verify form is linked to spreadsheet and trigger is active (check Extensions → Apps Script → Triggers).

### Q: Payment status not updating?
A: Manually update Contributions sheet or use "Mark Payment as Paid" menu option.

### Q: Numbers showing as text?
A: Select column → Format → Number → set to "Number" format.

### Q: Dropdown menu not appearing?
A: Close spreadsheet completely and reopen. Wait 30 seconds after opening.

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open menu | Alt+M (or use mouse) |
| Save sheet | Ctrl+S (Windows) / Cmd+S (Mac) |
| Search sheet | Ctrl+F (Windows) / Cmd+F (Mac) |
| Insert row | Right-click → Insert 1 above |
| Delete row | Right-click → Delete row |

---

## Best Practices

1. **Backup Regularly**
   - Use "Backup Data" function monthly
   - Or manually download backup from Google Drive

2. **Archive Annually**
   - Archive previous year after close
   - Keeps system fast and organized

3. **Clean Up Logs**
   - Keep only recent logs (30 days)
   - Run cleanup function monthly

4. **Verify Data**
   - Regular audits of payment data
   - Confirm member information quarterly

5. **Test First**
   - Test emails with your own address
   - Use sample data when learning

6. **Communicate Changes**
   - Update treasurer contact when it changes
   - Update payment instructions as needed
   - Notify members of any policy changes

---

## Getting Help

If you need help:

1. Check the **"Setup & Documentation"** option in the menu
2. Review the **Troubleshooting** section above
3. Check **DEPLOYMENT.md** for technical issues
4. Review **SPREADSHEET_SETUP.md** for data structure questions
5. Check the **Logs** sheet for system messages

---

**Ready to use the system?** Start by adding your first members and sending a test reminder!
