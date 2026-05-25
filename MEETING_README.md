# Meeting Management System

A complete, modular system for organizing, tracking, and managing community meetings built on Google Apps Script.

## 🎯 Overview

The Meeting Management System is a standalone, production-ready platform for:
- Scheduling meetings with topics, speakers, and attendees
- Managing a topic library with categories and discussion frequency
- Automating speaker rotation for fair participation
- Tracking attendance and engagement
- Recording meeting minutes and action items
- Sending automated reminders and agenda emails
- Generating comprehensive analytics and reports

**Perfect for:** Community organizations, churches, clubs, associations, and groups needing structured meeting management.

## ✨ Key Features

### 📅 Meeting Scheduling
- Schedule meetings with dates, times, locations, and topics
- Auto-assign speakers using fair rotation system
- Track meeting status (Scheduled, In Progress, Completed, Cancelled)
- Send automated agenda emails 24 hours before meeting
- Support for virtual (Zoom) and physical meetings

### 🎤 Speaker Management
- Maintain speaker directory with expertise areas
- Fair rotation algorithm prevents speaker burnout
- Track times each person has spoken
- Rate speakers and collect feedback
- Recognize top contributors
- Toggle speaker availability as needed

### 📚 Topic Library
- Curated library of discussion topics
- Organize by category (Finance, Growth, Leadership, Wellness, etc.)
- Track difficulty levels and recommended duration
- Schedule topics based on frequency (Weekly, Monthly, Quarterly, Annual)
- Suggest topics due for discussion
- Attach resources and reference materials

### ✅ Attendance Tracking
- Record who attended each meeting
- Track participation level (Yes/No/Moderate/Partial)
- Collect feedback scores
- Calculate attendance rates and trends
- Identify trends in member engagement
- Support for arrival/departure times

### 📝 Meeting Minutes
- Structured template for recording minutes
- Capture discussion points, decisions, and action items
- Assign owners and due dates to action items
- Track action item status (Open/Overdue/Completed)
- Approval workflow for official minutes
- Send minutes to attendees automatically

### 📧 Email Automation
- Automated meeting agenda emails
- Action item reminders (3 days before due)
- Meeting cancellation notifications
- Minutes distribution
- Custom email templates with organization branding

### 📊 Comprehensive Reporting
- Speaker performance reports
- Attendance trends and rates
- Topic usage and recommendations
- Meeting completion statistics
- Action item tracking
- System health monitoring

---

## 🚀 Quick Start (Separate Spreadsheet)

### 1. Create New Spreadsheet
- Go to [Google Sheets](https://sheets.google.com)
- Create: "Community Meeting Manager"
- Note the spreadsheet ID

### 2. Deploy Apps Script
- Click **Extensions** → **Apps Script**
- Copy all 8 .gs files into the editor
- Save the project

### 3. Grant Permissions
- Click **Run** on any function
- Authorize required permissions

### 4. Initialize System
- The system auto-creates all 8 sheets on first use
- Or manually run `initializeMeetingSystem()`

### 5. Configure Settings
- Go to **Settings** sheet
- Add your organization information

### 6. Start Using
- Reload the spreadsheet
- Click **"Meeting Management"** menu
- Begin scheduling meetings

**→ See MEETING_DEPLOYMENT.md for detailed instructions**

---

## 📁 Project Structure

### 8 Core Modules

| File | Purpose | Key Functions |
|------|---------|----------------|
| **MeetingCore.gs** | Main menu & meeting scheduling | `createMeeting()`, `scheduleNewMeeting()` |
| **Speakers.gs** | Speaker rotation & management | `getNextFairSpeaker()`, `generateSpeakerRotation()` |
| **Attendance.gs** | Attendance tracking | `recordAttendance()`, `calculateAttendanceTrends()` |
| **Minutes.gs** | Meeting minutes & action items | `saveMinutes()`, `getOpenActionItems()` |
| **Topics.gs** | Topic library management | `addTopic()`, `getTopicsDueForDiscussion()` |
| **Analytics.gs** | Reporting & analytics | `generateSpeakerReport()`, `generateMeetingAnalytics()` |
| **MeetingEmail.gs** | Email automation | `sendAgendaEmail()`, `sendMeetingMinutesEmail()` |
| **MeetingUtils.gs** | Utility functions | `initializeMeetingSystem()`, `backupMeetingData()` |

### Configuration File
- **meeting-appsscript.json** - Project manifest with OAuth scopes

---

## 📋 Database Structure

### 8 Sheets (Auto-Created)

1. **Meeting_Schedule** - Scheduled meetings with speakers and topics
2. **Topics** - Library of discussion topics organized by category
3. **Speaker_Rotation** - Speaker information and history
4. **Attendance** - Who attended which meetings
5. **Meeting_Minutes** - Minutes, decisions, and action items
6. **Discussion_Resources** - PDFs, links, and materials for topics
7. **Settings** - System configuration (customizable)
8. **Logs** - Automatic activity audit trail

---

## 🎯 Menu Options

```
Meeting Management
├─ 📅 Schedule New Meeting
├─ 🎤 Assign Speaker to Topic
├─ 📜 Generate Speaker Rotation
├─ 📧 Send Meeting Agenda
├─ ✅ Record Meeting Attendance
├─ 📝 Record Meeting Minutes
├─ 📚 Add Topic to Library
├─ 🗳️ View Topic History
├─ 📊 Speaker Report
├─ 👥 Attendance Report
├─ 📈 Meeting Analytics
└─ ⚙️ Settings & Documentation
```

---

## 🔧 Customization Options

All settings are configurable in the **Settings** sheet:

```
Organization Name        | Your Organization
Default Meeting Time     | 7:00 PM
Default Location         | Community Hall
Admin Email             | admin@email.com
Reminder Email Template | [Customizable]
Enable Attendance       | Yes/No
Enable Feedback Scores  | Yes/No
```

---

## 💻 Technical Details

- **Runtime:** Google Apps Script V8
- **Language:** JavaScript
- **Services Used:** Sheets API, Gmail API
- **Cost:** Completely Free
- **Storage:** Google Drive (unlimited for Google Workspace)
- **Scalability:** Handles 100+ speakers, 1000+ meetings efficiently

---

## 📚 Documentation

Comprehensive documentation included:

1. **MEETING_README.md** (this file) - Overview and quick start
2. **MEETING_DEPLOYMENT.md** - Step-by-step installation guide
3. **MEETING_USER_GUIDE.md** - Feature usage and workflows
4. **MEETING_QUICK_REFERENCE.md** - Quick reference cheat sheet

---

## 🔐 Security & Privacy

✅ **Zero-Cost & Secure**
- Data stays entirely in your Google account
- No external services or APIs required
- OAuth 2.0 authentication
- Automatic activity logging
- Data backups to Google Drive

---

## ✅ What You Can Do

✅ **Schedule & Organize**
- Plan meetings weeks in advance
- Assign speakers fairly using rotation
- Manage topic library
- Send automated reminders

✅ **Track & Report**
- Monitor attendance trends
- See speaker performance
- Track action items
- Generate comprehensive reports

✅ **Engage Community**
- Fair speaker opportunity
- Regular structured discussions
- Leadership development
- Documented decisions

---

## 📊 Typical Meeting Workflow

```
1. SCHEDULE MEETING
   └─ Set date, time, location, topic, speaker
   
2. SEND AGENDA
   └─ System sends 24 hours before
   
3. HOLD MEETING
   └─ Conduct discussion
   
4. RECORD ATTENDANCE
   └─ Mark who attended
   
5. RECORD MINUTES
   └─ Capture decisions & action items
   
6. TRACK ACTIONS
   └─ System reminds owners of due dates
   
7. ANALYZE & IMPROVE
   └─ Review reports and analytics
```

---

## 🎓 Example Use Cases

### Monthly Community Meeting
```
- Schedule 1st Wednesday of each month
- Rotating speakers each month
- 5-7 discussion topics in library
- Track attendance and engagement
- Monthly summary report
```

### Church Group Meetings
```
- Weekly Bible study discussions
- Rotating leaders
- Topic library organized by books
- Track participation
- Quarterly engagement reports
```

### Leadership Development
```
- Monthly speaker assignments
- Rate each speaker's performance
- Build speaking experience
- Track growth over time
- Recognize top contributors
```

---

## 🚀 Next Steps

1. **Deploy the system** - Follow MEETING_DEPLOYMENT.md
2. **Configure settings** - Add your organization info
3. **Add speakers** - Create speaker directory
4. **Build topic library** - Add discussion topics
5. **Schedule first meeting** - Test the workflow
6. **Generate reports** - See analytics in action
7. **Train team** - Share MEETING_USER_GUIDE.md

---

## 💡 Tips for Success

- **Start with core speakers** - Add a few trusted speakers first
- **Build topic library** - Curate topics ahead of time
- **Use rotation** - Let system suggest next speaker
- **Track consistently** - Record attendance every meeting
- **Review analytics** - Use reports to improve engagement
- **Archive annually** - Keep history organized
- **Backup regularly** - Use backup function monthly

---

## 📞 Support

- **Questions about features?** → See MEETING_USER_GUIDE.md
- **Setup questions?** → See MEETING_DEPLOYMENT.md
- **Need quick answers?** → See MEETING_QUICK_REFERENCE.md
- **System not working?** → Check Logs sheet for errors

---

## Version Info

**Meeting Management System v1.0**
- Status: Production Ready
- Runtime: Google Apps Script V8
- Compatible: All Google Sheets
- Cost: Completely Free

---

**Ready to organize better meetings?** Start with MEETING_DEPLOYMENT.md now! 🚀

For usage instructions, see MEETING_USER_GUIDE.md 📚

For quick reference, check MEETING_QUICK_REFERENCE.md 📋
