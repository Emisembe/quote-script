# Meeting Management System - Deployment Guide

Complete step-by-step instructions for deploying the Meeting Management System as a separate spreadsheet.

## Prerequisites

✅ Google account with Sheets and Gmail access  
✅ Basic familiarity with Google Sheets  
✅ Google Apps Script knowledge (helpful but not required)

---

## Part 1: Create the Spreadsheet

### Step 1: Create New Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click **"New"** button
3. Select **"Blank spreadsheet"**
4. Name it: **"Community Meeting Manager"** (or your preferred name)
5. Note the spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit
   ```

### Step 2: Create Required Sheets

The system will auto-create sheets, but you can create them manually:

1. Click the **"+"** button to add new sheets
2. Create these 8 sheets (exact names required):
   - Meeting_Schedule
   - Topics
   - Speaker_Rotation
   - Attendance
   - Meeting_Minutes
   - Discussion_Resources
   - Settings
   - Logs

**Note:** You can skip this step if you prefer auto-initialization.

### Step 3: Add Headers (Optional - Auto-Created)

If you created sheets manually, add these headers:

**Meeting_Schedule:**
```
Meeting ID | Date | Time | Location | Topic ID | Topic Title | Primary Speaker | Facilitator | Expected Attendance | Status | Description | Notes | Resources | Created Date
```

**Topics:**
```
Topic ID | Title | Category | Description | Duration (min) | Difficulty | Resource Links | Last Discussed | Frequency | Status
```

**Speaker_Rotation:**
```
Speaker ID | Speaker Name | Times Spoken | Last Speaking Date | Topics Spoken | Rating | Expertise Areas | Willing to Speak | Preferred Topics | Email
```

**Attendance:**
```
Meeting ID | Speaker ID | Speaker Name | Attended | Arrival Time | Departure Time | Participation Level | Feedback Score | Notes
```

**Meeting_Minutes:**
```
Meeting ID | Date Recorded | Key Discussion Points | Decisions Made | Action Items | Owners | Due Dates | Next Steps | Recorded By | Status
```

**Discussion_Resources:**
```
Resource ID | Meeting ID | Topic ID | Title | Resource Type | Link | Description | Added Date | Uploaded By
```

**Settings:**
```
Setting | Value
```

**Logs:**
```
Timestamp | Action | Details | User
```

---

## Part 2: Deploy Apps Script

### Step 1: Open Apps Script Editor

1. In your Meeting Manager spreadsheet, click **Extensions** → **Apps Script**
2. A new tab will open with the script editor
3. Delete the default code if any

### Step 2: Add All 8 Script Files

Create 8 files in Apps Script (one for each module):

**How to create a new file:**
1. In the left sidebar, click the **"+"** next to "Files"
2. Click **"Script"**
3. Name it (see list below)
4. Paste the code
5. Save

**Files to create (in any order):**

1. **MeetingCore.gs** - Copy from `MeetingCore.gs`
2. **Speakers.gs** - Copy from `Speakers.gs`
3. **Attendance.gs** - Copy from `Attendance.gs`
4. **Minutes.gs** - Copy from `Minutes.gs`
5. **Topics.gs** - Copy from `Topics.gs`
6. **Analytics.gs** - Copy from `Analytics.gs`
7. **MeetingEmail.gs** - Copy from `MeetingEmail.gs`
8. **MeetingUtils.gs** - Copy from `MeetingUtils.gs`

### Step 3: Update Project Settings

1. Click the project name at the top
2. Click **"Project Settings"** (gear icon)
3. Scroll to "Manifest" section
4. Copy the content from `meeting-appsscript.json`:
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
         }
       ]
     },
     "exceptionLogging": "STACKDRIVER",
     "runtimeVersion": "V8",
     "timeZone": "Africa/Nairobi",
     "oauthScopes": [
       "https://www.googleapis.com/auth/spreadsheets",
       "https://www.googleapis.com/auth/gmail.send"
     ]
   }
   ```

### Step 4: Save Project

1. Click **"Save"** button (or Ctrl+S / Cmd+S)
2. Choose a name: "Meeting Management System"
3. Click **"Create"**

---

## Part 3: Grant Permissions

### Step 1: Authorize Access

1. In Apps Script, click the function dropdown at the top
2. Select any function (e.g., `initializeMeetingSystem`)
3. Click **"Run"** button
4. System will prompt for authorization
5. Select your Google account
6. Review permissions requested
7. Click **"Allow"** to grant permissions

**Permissions being requested:**
- View and manage spreadsheets
- Send emails via Gmail
- View files in Google Drive

### Step 2: Verify Authorization

1. Check that the code executed without errors
2. Go back to your spreadsheet
3. Wait 30 seconds for the page to reload
4. You should see **"Meeting Management"** menu appear

---

## Part 4: Initialize System

### Option 1: Auto-Initialize (Recommended)

1. Go to your Meeting Manager spreadsheet
2. Click **Meeting Management** → **Settings & Documentation**
3. System auto-initializes on first use

### Option 2: Manual Initialize

1. Go to Apps Script editor
2. Function dropdown → Select `initializeMeetingSystem`
3. Click **"Run"**
4. System creates all 8 sheets with headers

### Option 3: Check/Verify

If sheets don't auto-create:
1. Manually create the 8 sheets listed in Part 1
2. Add the headers shown above
3. System will populate them on first use

---

## Part 5: Configure Settings

### Step 1: Set Organization Information

1. Go to **Settings** sheet in your spreadsheet
2. Add these configuration rows:

```
Organization Name              | Your Organization Name
Default Meeting Time           | 7:00 PM
Default Location              | Community Hall
Admin Email                   | your.email@gmail.com
Meeting Reminder Template     | (Optional - custom template)
Enable Attendance Tracking    | Yes
Enable Feedback Scores        | Yes
Enable Email Reminders        | Yes
```

### Step 2: Customize Settings

You can add any settings you want:

```
Setting Name                  | Value
Communication Channel         | WhatsApp / Email / SMS
Meeting Agenda Template       | (Custom format)
Backup Frequency             | Monthly
Default Speaker              | (If applicable)
```

---

## Part 6: Test the System

### Test 1: Check Menu

1. Go to spreadsheet
2. Should see **"Meeting Management"** menu
3. Click it to verify all items appear

### Test 2: Test Email Configuration

1. Click **Meeting Management** → **Settings & Documentation**
2. Or go to Apps Script → Run `testMeetingEmailConfiguration()`
3. Check your email for test message
4. If no email → permission or configuration issue

### Test 3: Add a Sample Speaker

1. Go to **Speaker_Rotation** sheet
2. Add a test speaker:
   ```
   SPK-0001 | Test Speaker | 0 | | | 0 | Testing | Yes | All Topics | your.email@gmail.com
   ```
3. Run `getAllSpeakers()` to verify it loads

### Test 4: Add a Sample Topic

1. Click **Meeting Management** → **Add Topic to Library**
2. Fill in:
   - Title: "Test Topic"
   - Category: "Testing"
   - Others: Optional
3. Click "Add to Library"
4. Should see Topic ID assigned

### Test 5: Schedule Test Meeting

1. Click **Meeting Management** → **Schedule New Meeting**
2. Fill in:
   - Date: Tomorrow
   - Time: 7:00 PM
   - Location: Test Location
   - Speaker: Test Speaker
3. Click "Schedule Meeting"
4. Should create Meeting_Schedule entry

### Test 6: Test Analytics

1. Click **Meeting Management** → **Meeting Analytics**
2. Should display analytics popup
3. Shows metrics and trends

---

## Part 7: Set Up Automated Features

### Optional: Setup Triggers for Automation

Triggers run automatic tasks at scheduled times:

1. In Apps Script, click **Triggers** (alarm icon on left)
2. Click **"Create new trigger"**
3. Configure:
   - Function: `sendActionItemReminders`
   - Type: Time-driven
   - Frequency: Daily timer, 8:00 AM

**Other triggers you can set up:**
- Daily action item reminders (8 AM)
- Weekly report generation (Friday 5 PM)
- Daily backup (11 PM)

---

## Part 8: Set Up Sharing (Optional)

### Share with Team

1. Open your Meeting Manager spreadsheet
2. Click **Share** button (top right)
3. Add team member emails
4. Choose role:
   - **Editor** - Can schedule, record, edit everything
   - **Commenter** - Can view and comment
   - **Viewer** - Read-only access

### Recommended Sharing:

- **Organizers/Admins:** Editor
- **Speakers:** Editor or Commenter
- **Members:** Viewer or Commenter

---

## Troubleshooting

### Problem: Menu doesn't appear

**Solution:**
1. Close the spreadsheet completely
2. Wait 2 minutes
3. Reopen the spreadsheet
4. Refresh page (Ctrl+R or Cmd+R)
5. Wait 30 seconds for Apps Script to load

### Problem: "Authorization required" error

**Solution:**
1. Go to Extensions → Apps Script
2. Run any function (click **Run**)
3. Authorize when prompted
4. Return to spreadsheet and refresh

### Problem: Emails not sending

**Solution:**
1. Run `testMeetingEmailConfiguration()`
2. Check your email spam folder
3. Verify Settings sheet has valid "Admin Email"
4. Check Gmail account has email sending enabled

### Problem: Sheets not auto-creating

**Solution:**
1. Go to Apps Script
2. Run `initializeMeetingSystem()`
3. Should create all 8 sheets
4. If fails, check error in Execution log

### Problem: Function not found error

**Solution:**
1. Verify all 8 .gs files were pasted correctly
2. Check file names are exactly as specified
3. Save all files (Ctrl+S)
4. Close and reopen Apps Script tab

---

## Next Steps After Deployment

1. ✅ **Configure Settings** - Add your organization info
2. ✅ **Add Speakers** - Create your speaker directory
3. ✅ **Build Topic Library** - Add discussion topics
4. ✅ **Schedule First Meeting** - Test the workflow
5. ✅ **Record Attendance** - Try attendance tracking
6. ✅ **Generate Reports** - See analytics
7. ✅ **Train Team** - Share access with team members
8. ✅ **Set Up Triggers** - Enable automated reminders (optional)

---

## Daily Operations Checklist

### Before Each Meeting
- [ ] Confirm meeting is scheduled
- [ ] Verify speaker assigned
- [ ] Send agenda email (24 hours before)

### During Meeting
- [ ] Update meeting status to "In Progress"

### After Meeting
- [ ] Record attendance
- [ ] Record minutes
- [ ] Record action items with owners/due dates
- [ ] Mark meeting as "Completed"

### Weekly
- [ ] Review action items due this week
- [ ] Generate attendance report
- [ ] Check next topic due for discussion

### Monthly
- [ ] Generate speaker report
- [ ] Review meeting analytics
- [ ] Archive completed meeting minutes
- [ ] Backup data

### Annually
- [ ] Archive all previous year data
- [ ] Review speaker performance
- [ ] Assess topic library
- [ ] Update organization settings

---

## Advanced Configuration

### Custom Email Templates

1. Go to Settings sheet
2. Create custom email template:
   ```
   Email Template Name | [Your custom HTML template]
   ```

3. Use variables:
   - {MEETING_TOPIC}
   - {MEETING_DATE}
   - {SPEAKER_NAME}
   - {MEETING_LOCATION}

### Custom Reporting

1. Go to Apps Script
2. Create custom report functions
3. Schedule with triggers
4. Generate on-demand via menu

### Integration with Membership System

If using both Meeting Management + Membership System:

1. Get member list from Membership System
2. Import to Speaker_Rotation sheet
3. Sync attendance with member records
4. Link to payment/contribution tracking (optional)

---

## Maintenance

### Regular Tasks

**Daily:**
- Check Logs sheet for errors
- Verify emails sending

**Weekly:**
- Archive old logs (>30 days)
- Review open action items

**Monthly:**
- Backup data
- Verify all features working
- Review analytics

**Quarterly:**
- Evaluate speaker performance
- Plan upcoming topics
- Update settings as needed

**Annually:**
- Archive previous year
- Review system configuration
- Plan improvements

---

## Getting Help

**Setup issues?** Check this file  
**How to use?** See MEETING_USER_GUIDE.md  
**Need quick reference?** See MEETING_QUICK_REFERENCE.md  
**Check system status?** Look at Logs sheet  
**Something broken?** Check error in Execution log

---

**Congratulations!** Your Meeting Management System is now deployed and ready to use! 🎉

Start scheduling meetings and organizing discussions today.
