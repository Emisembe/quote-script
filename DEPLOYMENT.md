# Deployment Guide

## Prerequisites

Before deploying, ensure you have:
- ✅ A Google account with Google Sheets access
- ✅ A Google Sheets document created
- ✅ All required sheets set up (see SPREADSHEET_SETUP.md)
- ✅ Settings sheet configured with your organization details
- ✅ Basic understanding of Google Apps Script

## Deployment Steps

### Step 1: Create the Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click "New" → "Spreadsheet"
3. Name it: "Community Management System" (or your preferred name)
4. Note the spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit
   ```

### Step 2: Set Up Sheet Structure

1. Follow the setup instructions in **SPREADSHEET_SETUP.md**
2. Create all required sheets:
   - Members
   - Contributions
   - Events
   - Payments
   - Settings
   - Logs
3. Add appropriate headers to each sheet
4. Configure the Settings sheet with your organization details

### Step 3: Access Google Apps Script Editor

1. In your spreadsheet, click **"Extensions"** → **"Apps Script"**
2. A new tab will open with the script editor
3. Delete the default `function myFunction() {}` code

### Step 4: Add All Script Files

#### In the left sidebar:
1. Click the **"+"** button next to "Files"
2. Create a new file for each module (or paste code into one file, but modular is better)

#### Copy and paste the following files into the editor:

**File 1: Code.gs** (Main menu and core functions)
- Copy contents from `Code.gs` 
- This is the entry point

**File 2: Forms.gs** (Google Form integration)
- Copy contents from `Forms.gs`
- Handles form submissions and member registration

**File 3: Email.gs** (Email automation)
- Copy contents from `Email.gs`
- All email functions for reminders, confirmations, notifications

**File 4: Payments.gs** (Payment tracking)
- Copy contents from `Payments.gs`
- Payment processing and tracking functions

**File 5: Reports.gs** (Report generation)
- Copy contents from `Reports.gs`
- All report functions

**File 6: Triggers.gs** (Automation triggers)
- Copy contents from `Triggers.gs`
- Scheduled task setup and management

**File 7: Utils.gs** (Utility functions)
- Copy contents from `Utils.gs`
- Helper functions used throughout the system

#### Special File: appsscript.json

1. Click on the file name dropdown next to your project name
2. Select **"Project Settings"**
3. Under "Manifest", copy the JSON from `appsscript.json`:
   ```json
   {
     "type": "sheets",
     "dependencies": {
       "enabledAdvancedServices": [
         {
           "userSymbol": "SpreadsheetApp",
           "serviceId": "sheets",
           "version": "v4"
         },
         {
           "userSymbol": "GmailApp",
           "serviceId": "gmail",
           "version": "v1"
         },
         {
           "userSymbol": "FormApp",
           "serviceId": "forms",
           "version": "v1"
         }
       ]
     },
     "exceptionLogging": "STACKDRIVER",
     "runtimeVersion": "V8",
     "timeZone": "Africa/Nairobi",
     "oauthScopes": [
       "https://www.googleapis.com/auth/spreadsheets",
       "https://www.googleapis.com/auth/gmail.send",
       "https://www.googleapis.com/auth/forms.currentonly"
     ]
   }
   ```

### Step 5: Save and Grant Permissions

1. Click **"Save"** in the Apps Script editor
2. The system will prompt you to authorize access
3. Click **"Authorize access"**
4. Select your Google account
5. Review the permissions requested
6. Click **"Allow"** to grant permissions

**Permissions Being Requested:**
- **View and manage spreadsheets** - To read/write to your sheets
- **Send emails** - To send automated reminder and confirmation emails
- **Create forms** - To create/manage the member registration form
- **View files in Google Drive** - For backup functionality

### Step 6: Initialize the System

1. Go back to your spreadsheet
2. Wait for the page to reload
3. You should see a new menu: **"Community Management"**
4. Click **"Community Management"** → **"Setup & Documentation"**
5. Or manually initialize by running the `initializeSystem()` function:
   - In the Apps Script editor, click the function dropdown
   - Select `initializeSystem`
   - Click **"Run"**
   - Authorize if prompted

### Step 7: Configure Settings

1. In your spreadsheet, go to the **"Settings"** sheet
2. Add your organization information:

```
Organization Name        | My Community Organization
Treasurer Email          | treasurer@myorganization.com
Payment Instructions     | Transfer to: Account #123456789 at XYZ Bank
Organization Description | We are a community organization dedicated to...
Website URL             | https://myorganization.com
Admin Email             | admin@myorganization.com
```

### Step 8: Create the Member Registration Form

**Option A: Auto-create (Recommended)**
1. In your spreadsheet, click **"Community Management"** → **"🎫 Generate Member IDs"**
2. Or run `getOrCreateMemberForm()` from the Apps Script editor
3. The system will create a form and save its URL to the Settings sheet

**Option B: Manual Setup**
1. Go to [Google Forms](https://forms.google.com)
2. Click **"New form"** → **"Blank form"**
3. Add these questions:
   - **Full Name** (Short answer, required)
   - **Phone Number** (Short answer, required)
   - **Email** (Email, required)
   - **Group/Region** (Short answer, optional)
   - **Notes** (Paragraph, optional)
4. In the form, click the "Spreadsheet" icon to link it to your spreadsheet
5. Select your "Community Management System" spreadsheet
6. Copy the form's sharing link
7. Add the form URL to the Settings sheet:
   ```
   Form URL | https://docs.google.com/forms/d/...
   ```

### Step 9: Set Up Automated Triggers

Triggers allow the system to run tasks automatically.

**Method 1: Auto-setup (Recommended)**
1. In the Apps Script editor, select the function dropdown
2. Choose `setupAllTriggers`
3. Click **"Run"**

**Method 2: Manual Setup**
1. In the Apps Script editor, click **"Triggers"** (alarm icon on left)
2. Click **"Create new trigger"**
3. Set up these triggers:

**Trigger 1: Daily Overdue Reminders**
- Function: `dailyOverdueReminderCheck`
- Type: Time-driven
- Frequency: Day timer, 8:00 AM

**Trigger 2: Weekly Payment Report**
- Function: `weeklyPaymentReport`
- Type: Time-driven
- Frequency: Weekly, Monday 9:00 AM

**Trigger 3: Batch Payment Processing**
- Function: `processBatchPayments`
- Type: Time-driven
- Frequency: Day timer, 5:00 PM

**Trigger 4: Form Submission (Optional)**
- Function: `onFormSubmit`
- Type: Event
- Source: Form
- Event: On form submit

### Step 10: Test the System

1. **Test Email Configuration:**
   - In the Apps Script editor, select `testEmailConfiguration`
   - Click **"Run"**
   - Check your email for a test message

2. **Test Member Registration:**
   - Open the member registration form
   - Submit a test entry
   - Check the Members sheet to confirm entry was added
   - Confirm you received a welcome email

3. **Test Reminders:**
   - Go to the spreadsheet
   - Click **"Community Management"** → **"Send Contribution Reminders"**
   - Type "UNPAID" and click OK
   - Check your email for reminder messages

4. **Test Payment Marking:**
   - Click **"Community Management"** → **"Mark Payment as Paid"**
   - Enter a Member ID
   - Confirm payment status changed and confirmation email sent

5. **Test Reports:**
   - Click **"Community Management"** → **"Generate Payment Report"**
   - Verify report displays correctly

### Step 11: Configure Email Settings

The system uses your Google account to send emails. To customize email behavior:

1. In the Settings sheet, ensure these are configured:
   ```
   Treasurer Email          | (email for payment inquiries)
   Payment Instructions     | (how members should pay)
   Organization Description | (what will appear in welcome email)
   ```

2. Emails will be sent from your Google account
   - Sender: Your Google account email
   - Reply-to: Set to noReply (members shouldn't reply)

### Step 12: Enable Member Form Automatic Processing

When members submit the form, the system can automatically:
- Create Members sheet entry
- Generate unique Member ID
- Send welcome email

**Setup:**
1. Link your form to the spreadsheet (if not already done)
2. The onFormSubmit trigger will activate automatically
3. Test by submitting the form again

## Daily Operations Checklist

### Weekly
- [ ] Review weekly payment report (sent Monday 9 AM)
- [ ] Check Logs sheet for any errors

### Monthly
- [ ] Set contribution amounts for the month
- [ ] Send payment reminders (automated daily, but can also send manually)
- [ ] Review outstanding payments
- [ ] Archive paid contributions

### Quarterly
- [ ] Generate full payment report
- [ ] Review member list for inactive members
- [ ] Update organization information if needed

### Annually
- [ ] Create new year contribution sheet
- [ ] Archive previous year data
- [ ] Clean up old logs
- [ ] Backup all data

## Troubleshooting

### Issue: "Authorization required" when opening spreadsheet
**Solution:** 
1. Go to Extensions → Apps Script
2. Click "Run" next to any function
3. Authorize when prompted

### Issue: Menu doesn't appear in spreadsheet
**Solution:**
1. Close the spreadsheet completely
2. Open it again
3. Wait 30 seconds for Apps Script to load
4. Refresh the page (Ctrl+R or Cmd+R)

### Issue: Emails not being sent
**Solution:**
1. Run `testEmailConfiguration()` to test
2. Check Settings sheet has valid Treasurer Email
3. Ensure email addresses in Members sheet are valid
4. Check Gmail quotas (Google has daily limits)

### Issue: Form not auto-creating entries
**Solution:**
1. Ensure form is linked to the spreadsheet
2. Run `setupFormSubmissionTrigger()` to create trigger
3. Check Logs sheet for errors
4. Verify all required sheets exist

### Issue: Permission errors
**Solution:**
1. Go to Apps Script project settings
2. Check OAuth scopes include:
   - https://www.googleapis.com/auth/spreadsheets
   - https://www.googleapis.com/auth/gmail.send
   - https://www.googleapis.com/auth/forms.currentonly
3. Re-authorize the application

### Issue: Triggers not firing
**Solution:**
1. Go to Apps Script → Triggers
2. Verify triggers are set up and active
3. Check the timezone is correct (set to your timezone)
4. Remove and recreate triggers if needed

## Performance Optimization

For systems with 1000+ members:

1. **Archive old data** - Move completed years to archive sheets
2. **Clean logs** - Run `clearOldLogs(30)` monthly
3. **Optimize sheets** - Unfreeze rows if not needed
4. **Limit form responses** - Archive old form responses

## Backup and Recovery

### Create a Backup
1. In the spreadsheet, click **"Community Management"** → **"Setup & Documentation"**
2. Or run `backupData()` from Apps Script
3. System creates a copy in "Membership System Backups" folder

### Restore from Backup
1. Go to Google Drive
2. Find the backup file in "Membership System Backups" folder
3. Right-click → "Make a copy"
4. Work with the copy as needed

## Maintenance Tasks

### Monthly Tasks
- [ ] Clear logs older than 30 days
- [ ] Verify Settings sheet is current
- [ ] Check for duplicate members
- [ ] Archive completed payments

### Quarterly Tasks
- [ ] Backup full system
- [ ] Review and remove inactive members
- [ ] Test email configuration
- [ ] Review all triggers are active

### Annual Tasks
- [ ] Archive previous year contributions
- [ ] Create new year sheets
- [ ] Backup full system to external storage
- [ ] Review and optimize spreadsheet

## Getting Help

If you encounter issues:

1. Check the Logs sheet for error messages
2. Refer to SPREADSHEET_SETUP.md for data structure questions
3. Check USER_GUIDE.md for feature usage
4. Run `generateHealthReport()` to see system status
5. Review this guide's Troubleshooting section

## Next Steps

1. ✅ Complete all deployment steps above
2. ✅ Test with sample data
3. ✅ Configure member registration form
4. ✅ Set up automated triggers
5. ✅ Brief your team on using the system
6. ✅ Start onboarding members

---

**Congratulations!** Your Community Management System is now deployed and ready to use.
