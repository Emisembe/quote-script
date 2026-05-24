# Community Management System

A complete, zero-cost membership and contribution management platform built entirely on Google Sheets, Google Forms, Gmail, and Google Apps Script.

## 🎯 Overview

The Community Management System is a lightweight, production-ready solution for managing organizations like:
- Community groups and associations
- Churches and religious organizations
- SACCOs (Savings and Credit Cooperative Organizations)
- Welfare and mutual aid groups
- Sports clubs and social organizations
- Any member-based organization with recurring contributions

## ✨ Key Features

### 📊 Member Management
- Automated member registration via Google Form
- Unique member ID generation
- Member status tracking (Active, Inactive, Suspended)
- Flexible member grouping and region support
- Complete member contact directory

### 💰 Contribution Tracking
- Flexible contribution type support (Monthly, Quarterly, Annual, etc.)
- Payment status tracking (Paid, Unpaid, Partial, Overdue)
- Automatic balance calculation
- Payment date recording
- Outstanding balance overview

### 📧 Email Automation
- **Automated reminder emails** for unpaid contributions (daily at 8 AM)
- **Payment confirmation emails** when payments are recorded
- **Welcome emails** for new members
- **Event notification emails** with customizable recipients
- **Weekly payment reports** for administrators
- **Customizable email templates** with organization branding

### 📅 Event Management
- Create and notify members about community events
- Selective notification by membership status
- Event history and tracking

### 📈 Reporting & Analytics
- Payment status reports (Paid/Unpaid/Partial breakdown)
- Member list reports with contact information
- Contribution summary by type
- Financial summaries
- Exportable reports to new sheets

### 🔄 Automation & Scheduling
- **Daily overdue payment reminders** (8 AM)
- **Weekly payment reports** (Monday 9 AM)
- **Automatic batch payment processing** (5 PM daily)
- **Form submission auto-processing** (immediate)
- Customizable trigger system

### 📅 Yearly Management
- Automatic new year sheet creation
- Previous year archiving
- Active member carry-forward
- Template duplication for new cycles

### 🛡️ System Management
- Comprehensive activity logging
- Error tracking and notifications
- System health monitoring
- Data backup to Google Drive
- Backup restoration capability

---

## 🚀 Quick Start (5 Minutes)

### 1. Create Your Spreadsheet
- Go to [Google Sheets](https://sheets.google.com)
- Create a new spreadsheet

### 2. Install the Code
- Click **Extensions** → **Apps Script**
- Copy all `.gs` files from this project into the editor
- Save the project

### 3. Grant Permissions
- Click **Run** on any function
- Authorize the required permissions

### 4. Configure Settings
- Go to the **Settings** sheet
- Add your organization information

### 5. Start Using
- Reload the spreadsheet
- You'll see the "Community Management" menu
- Begin adding members and managing contributions

**👉 See DEPLOYMENT.md for detailed step-by-step instructions**

---

## 📁 Project Structure

```
community-management-system/
├── Code.gs                    # Main entry point, custom menu
├── Forms.gs                   # Google Form integration
├── Email.gs                   # Email automation functions
├── Payments.gs                # Payment tracking and processing
├── Reports.gs                 # Report generation
├── Triggers.gs                # Automation triggers and scheduling
├── Utils.gs                   # Utility and helper functions
├── appsscript.json            # Project configuration
├── README.md                  # This file
├── DEPLOYMENT.md              # Step-by-step deployment guide
├── SPREADSHEET_SETUP.md       # Database structure guide
└── USER_GUIDE.md              # How to use the system
```

### File Descriptions

| File | Purpose | Key Functions |
|------|---------|----------------|
| **Code.gs** | Main entry point & menu system | `onOpen()`, `menuSendReminders()`, `menuMarkPaymentPaid()` |
| **Forms.gs** | Google Form integration | `onFormSubmit()`, `getOrCreateMemberForm()`, `processFormSubmissions()` |
| **Email.gs** | Email automation | `sendContributionReminders()`, `sendWelcomeEmail()`, `sendEventNotification()` |
| **Payments.gs** | Payment processing | `updatePaymentRecord()`, `calculatePaymentStats()`, `getMemberPaymentHistory()` |
| **Reports.gs** | Report generation | `generatePaymentReport()`, `generateMemberListReport()`, `exportReportToSheet()` |
| **Triggers.gs** | Scheduled automation | `setupAllTriggers()`, `dailyOverdueReminderCheck()`, `weeklyPaymentReport()` |
| **Utils.gs** | Utilities & helpers | `createNewYearSheet()`, `archiveYearSheet()`, `generateHealthReport()` |

---

## 🗄️ Database Structure

The system uses 6 core sheets + optional archive sheets:

### Core Sheets
1. **Members** - Member information and status
2. **Contributions** - Contribution records and payment tracking
3. **Events** - Event history and notifications
4. **Payments** - Temporary payment staging
5. **Settings** - System configuration
6. **Logs** - Activity audit trail

### Optional Sheets
- **Archive_[YEAR]** - Historical data from previous years

**→ See SPREADSHEET_SETUP.md for complete structure details**

---

## 📋 Menu Options

When you open your spreadsheet, you'll see a **"Community Management"** menu with:

```
📝 Send Contribution Reminders      - Email payment reminders to members
📧 Send Event Notifications         - Notify members about events
✅ Mark Payment as Paid              - Record a single payment
📊 Generate Payment Report           - View payment summary
📆 Create New Year Sheet             - Prepare for new year
🗂️ Archive Previous Year             - Archive completed year
🔄 Sync Member Records              - Sync with form submissions
🎫 Generate Member IDs              - Create missing IDs
📧 Send Welcome Emails              - Send welcome to new members
⚙️ Setup & Documentation            - View system documentation
```

---

## 💻 Technical Stack

- **Database:** Google Sheets
- **Forms:** Google Forms
- **Automation:** Google Apps Script (JavaScript)
- **Email:** Gmail API
- **Storage:** Google Drive
- **Authentication:** Google OAuth 2.0

### Requirements
- Google Account (Gmail, Drive, Sheets access)
- No payment required - completely free
- No external dependencies
- No third-party services needed
- No hosting required

---

## 🔐 Security & Privacy

- **Data stays in your account** - All data is in your Google Drive
- **No external servers** - No data leaves Google
- **Automatic authorization** - OAuth 2.0 handles authentication
- **Activity logging** - All actions logged for audit trail
- **Email security** - Emails sent from your verified account
- **Backup capability** - Create backups of all data
- **Access control** - Share spreadsheet with specific users

---

## ✅ Checklist for Going Live

- [ ] All 6 core sheets created and configured
- [ ] Settings sheet completed with organization info
- [ ] Member registration form created and linked
- [ ] Apps Script deployed and authorized
- [ ] Test email configuration successful
- [ ] Test member added via form
- [ ] Triggers created and verified
- [ ] Team trained on using the system
- [ ] First batch of members added
- [ ] Backup system tested
- [ ] Email templates reviewed and customized
- [ ] System ready for production use

---

## 📞 Support

If you encounter issues:

1. **Check the documentation**
   - DEPLOYMENT.md has troubleshooting section
   - SPREADSHEET_SETUP.md explains data structure
   - USER_GUIDE.md has common issues

2. **Review system logs**
   - Go to Logs sheet
   - Look for error entries
   - Check recent actions

3. **Test components**
   - Run `testEmailConfiguration()`
   - Run `generateHealthReport()`
   - Check `checkSystemPermissions()`

---

## 🚀 Next Steps

1. **Deploy the system** - Follow DEPLOYMENT.md
2. **Configure settings** - Add your organization info
3. **Create the form** - For member registration
4. **Set up triggers** - For automation
5. **Add first members** - Test with real data
6. **Train users** - Share USER_GUIDE.md with team
7. **Go live** - Start collecting contributions!

---

## 📚 Documentation

This project includes comprehensive documentation:

1. **DEPLOYMENT.md** - Step-by-step deployment instructions
2. **SPREADSHEET_SETUP.md** - Database structure and setup
3. **USER_GUIDE.md** - How to use all features
4. **README.md** - This file (overview and quick start)

---

**Ready to deploy?** Start with DEPLOYMENT.md now! 🚀

For detailed user instructions, see USER_GUIDE.md 📚

Questions about data structure? Check SPREADSHEET_SETUP.md 📊