# Quick Reference Guide

A cheat sheet for common operations in the Community Management System.

## 🚀 Getting Started

### First Time Setup
```
1. Create spreadsheet
2. Create all 6 sheets (Members, Contributions, Events, Payments, Settings, Logs)
3. Add headers to each sheet
4. Go to Extensions → Apps Script
5. Paste all .gs files
6. Save and authorize
7. Configure Settings sheet
8. Create member registration form
9. Test with sample data
```

### Access the Menu
- Open your spreadsheet
- Look for **"Community Management"** menu at top
- Click to see available actions

---

## 👥 Member Management

### Add a New Member

**Via Form (Best):**
1. Share form link with member
2. They submit information
3. System auto-creates entry, ID, and welcome email

**Manually:**
1. Go to Members sheet
2. Add row: Name | Phone | Email | ACTIVE | Today | Group | Notes
3. Run "Generate Member IDs"

### Update Member Info
1. Go to Members sheet
2. Edit the row directly
3. Changes apply immediately

### Change Member Status
1. Go to Members sheet
2. Find member's row
3. Change Status column to: ACTIVE, INACTIVE, or SUSPENDED
4. Members with status other than ACTIVE won't receive notifications

---

## 💳 Payment Processing

### Record a Single Payment

**Quick Method:**
1. Menu → "Mark Payment as Paid"
2. Enter Member ID
3. Click OK
4. Payment marked as PAID, email sent

**Manual Method:**
1. Go to Contributions sheet
2. Find member's row
3. Update:
   - Amount Paid = enter amount
   - Payment Status = PAID/PARTIAL/UNPAID
   - Payment Date = today
   - Balance = Amount Due - Amount Paid

### Batch Process Multiple Payments

1. Go to Payments sheet
2. Add rows:
   ```
   MEM-0001 | 1000 | 2024-05-20
   MEM-0002 | 1000 | 2024-05-20
   MEM-0003 | 500  | 2024-05-21
   ```
3. Leave Status column blank
4. Next trigger at 5 PM processes them automatically

### Set Contribution Amount

**For All Members:**
1. Go to Contributions sheet
2. Manually enter amount in Amount Due column for each member
3. Balance auto-calculates

**Via Code (Advanced):**
1. Go to Apps Script
2. Run: `setContributionAmount(1000)` 
3. Sets amount for all members without an amount

---

## 📧 Email Operations

### Send Contribution Reminders

1. Menu → "Send Contribution Reminders"
2. Choose:
   - `UNPAID` = only unpaid members
   - `ALL` = all members
3. Click OK
4. Emails sent immediately

### Send Event Notifications

1. Menu → "Send Event Notifications"
2. Fill form:
   - Title: Event name
   - Date/Time: When event is
   - Details: What's happening
   - Recipients: All/Paid Only/Unpaid Only
3. Click "Send Notifications"
4. Event logged in Events sheet

### Send Welcome Emails

1. Menu → "Send Welcome Emails"
2. Click OK
3. System sends to new members without welcome email

---

## 📊 Reports

### Generate Payment Report

1. Menu → "Generate Payment Report"
2. View popup with:
   - Summary stats
   - Paid members (green)
   - Unpaid members (red)
   - Partial payments (yellow)
3. Can print or screenshot

### Export Report to Sheet

1. Go to Apps Script
2. Run: `exportReportToSheet('PAYMENT')`
3. Creates new sheet with data
4. Can download as CSV/Excel

### Generate Member List

1. Go to Apps Script
2. Run: `generateMemberListReport()`
3. View HTML report with all members

---

## 📅 Yearly Operations

### Create New Year Sheet

**Method 1 (Menu):**
1. Menu → "Create New Year Sheet"
2. Confirm year
3. System creates Contributions_YYYY sheet
4. Adds all ACTIVE members

**Method 2 (Code):**
1. Go to Apps Script
2. Run: `createNewYearSheet(2025)`
3. Confirm in prompt

### Archive Previous Year

**Method 1 (Menu):**
1. Menu → "Archive Previous Year"
2. Enter year (e.g., 2024)
3. Creates Archive_2024 sheet
4. Moved to end of spreadsheet

**Method 2 (Code):**
1. Go to Apps Script
2. Run: `archiveYearSheet(2024)`

---

## 🔧 System Management

### Test Email Configuration

1. Go to Apps Script
2. Run: `testEmailConfiguration()`
3. Check email for test message
4. If no email → permission/config issue

### Check System Health

1. Go to Apps Script
2. Run: `generateHealthReport()`
3. Shows:
   - Member count
   - Payment stats
   - Active triggers
   - Recent logs

### Check System Permissions

1. Go to Apps Script
2. Run: `checkSystemPermissions()`
3. Returns: Spreadsheet, Gmail, Form, Drive access status

### Backup Data

1. Menu → (No direct menu option)
2. Go to Apps Script
3. Run: `backupData()`
4. Creates backup in Drive folder "Membership System Backups"

### Clear Old Logs

1. Go to Apps Script
2. Run: `clearOldLogs(30)` (keeps last 30 days)
3. Deletes logs older than specified days

---

## ⚙️ Configuration

### Update Organization Settings

1. Go to **Settings** sheet
2. Update these values:

```
Setting                   | Value
Organization Name         | Your Org Name
Treasurer Email          | treasurer@email.com
Payment Instructions     | Transfer to: Account X at Bank Y
Organization Description | Brief description
Website URL             | https://yoursite.com
Admin Email             | admin@email.com
Form URL                | https://docs.google.com/forms/d/...
```

### Change Email Reminder Time

1. Go to Apps Script
2. Find Triggers.gs → setupAllTriggers()
3. Change `.atHour(8)` to desired hour (0-23)
4. Save and re-run setupAllTriggers()

### Change Report Schedule

1. Go to Apps Script
2. Find Triggers.gs → setupAllTriggers()
3. Modify trigger schedule
4. Re-run setupAllTriggers()

---

## 🔍 Finding Data

### Find a Member ID

1. Go to Members sheet
2. Ctrl+F (or Cmd+F on Mac)
3. Search by name, email, or phone
4. Member ID is in first column

### Find Payment History

1. Go to Contributions sheet
2. Ctrl+F to search by Member ID or Name
3. View all payment details in that row

### View Recent Actions

1. Go to Logs sheet
2. Scroll to bottom for most recent
3. See action, details, who did it, when

---

## 🆘 Troubleshooting Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| Menu not appearing | Close & reopen spreadsheet, wait 30 sec |
| Email not sending | Run `testEmailConfiguration()` to diagnose |
| Form not working | Check trigger active: Triggers section in Apps Script |
| Payment not updating | Use "Mark Payment as Paid" menu option |
| Member ID not showing | Run "Generate Member IDs" from menu |
| Report won't generate | Ensure Contributions sheet has data |
| Numbers showing as text | Select column → Format → Number |
| Permission error | Re-authorize: go to Extensions → Apps Script → run any function |

---

## 💡 Common Workflows

### Monthly Collection (Repeat Each Month)

```
Week 1: Send all reminders
  Menu → Send Contribution Reminders → ALL

Week 2-3: Record payments as received
  Menu → Mark Payment as Paid → [Member ID]
  (Or use batch Payments sheet)

Week 4: Generate report
  Menu → Generate Payment Report
  Email report to leadership

Daily (Automatic):
  8 AM: System sends overdue reminders
  5 PM: System processes batch payments
  9 AM Monday: System sends weekly report
```

### Quarterly Reporting

```
End of Quarter:
  Menu → Generate Payment Report
  View: Paid/Unpaid/Partial status
  Export: Run exportReportToSheet('PAYMENT')
  Analyze: Contribution trends
```

### Annual Cycle

```
January:
  Menu → Create New Year Sheet → [Current Year]
  Set contribution amounts for year
  
Throughout Year:
  Send reminders monthly
  Record payments
  
December:
  Final collections
  Menu → Archive Previous Year → [Last Year]
  
January (Next Year):
  Repeat cycle
```

---

## 📝 Data Entry Standards

Keep these consistent:

### Member Status Values
```
ACTIVE      (Currently active)
INACTIVE    (Not currently participating)
SUSPENDED   (Temporarily suspended)
```

### Payment Status Values
```
PAID        (Full payment received)
UNPAID      (No payment received)
PARTIAL     (Partial payment received)
OVERDUE     (Payment is late)
```

### Phone Format
```
+254712345678    (International format preferred)
```

### Date Format
```
MM/DD/YYYY or let Google Sheets auto-format
```

---

## 🎯 Performance Tips

### For Large Datasets (1000+ members)

1. **Archive yearly** - Move old data to archive sheets
2. **Clear logs monthly** - Run `clearOldLogs(30)`
3. **Batch operations** - Use Payments sheet for bulk updates
4. **Off-peak testing** - Run heavy operations at night

### Optimize Formulas
- Don't use volatile functions (RAND, TODAY, NOW)
- Use column formulas instead of individual cells
- Avoid circular references

### Reduce Email Load
- Send reminders on specific days, not daily
- Batch event notifications
- Group reports instead of individual emails

---

## 🔗 Important Links

**In Your System:**
- Members sheet: Core member data
- Contributions sheet: Payment tracking
- Settings sheet: Configuration
- Logs sheet: Activity audit trail

**In Google Drive:**
- Membership System Backups folder: Auto-backups
- Form responses: If linked to Drive

**In Apps Script:**
- Triggers: Scheduled automation
- Execution logs: Error tracking
- Console: Output from test runs

---

## 📞 When You Need Help

1. **How do I use a feature?** → See USER_GUIDE.md
2. **How do I set up?** → See DEPLOYMENT.md
3. **How is data structured?** → See SPREADSHEET_SETUP.md
4. **Quick answers?** → This file (QUICK_REFERENCE.md)
5. **System overview?** → See README.md

---

## ✅ Daily Checklist

**Every Day:**
- [ ] Check for new form submissions
- [ ] Review payment logs

**Every Week:**
- [ ] Review weekly report (sent Monday 9 AM)
- [ ] Check Logs sheet for issues

**Every Month:**
- [ ] Send reminders
- [ ] Record payments
- [ ] Generate monthly report

**Every Quarter:**
- [ ] Generate comprehensive report
- [ ] Review member status
- [ ] Check system health

**Every Year:**
- [ ] Create new year sheet
- [ ] Archive previous year
- [ ] Backup system
- [ ] Update organization info

---

**Need more help?** Check the full documentation files included in the project.

**Ready to use?** You're all set! Start managing your organization 🚀
