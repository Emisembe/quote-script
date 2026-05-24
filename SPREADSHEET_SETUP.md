# Spreadsheet Structure and Setup

## Overview

The Community Management System uses a Google Sheets-based database with separate sheets for different types of data. This document explains the structure and how to set it up.

## Sheet Structure

### 1. **Members Sheet**
Stores information about all community members.

**Columns:**
- **Member ID** (A): Unique identifier (e.g., MEM-0001)
- **Full Name** (B): Member's complete name
- **Phone Number** (C): Contact phone number
- **Email** (D): Email address
- **Membership Status** (E): ACTIVE, INACTIVE, or SUSPENDED
- **Join Date** (F): Date member joined
- **Group/Region** (G): Member's group or region (optional)
- **Notes** (H): Additional notes about the member

**Example Row:**
```
MEM-0001 | John Doe | +254712345678 | john@email.com | ACTIVE | 2024-01-15 | North Group | Regular contributor
```

**Tips:**
- Member ID is auto-generated when adding new members via form
- Keep emails unique to avoid duplicates
- Use consistent status values: ACTIVE, INACTIVE, SUSPENDED

---

### 2. **Contributions Sheet**
Tracks contribution payments and status.

**Columns:**
- **Member ID** (A): Link to member
- **Member Name** (B): Auto-filled from Members sheet
- **Contribution Type** (C): Monthly, Quarterly, Annual, etc.
- **Amount Due** (D): Total amount due
- **Amount Paid** (E): Amount already paid
- **Payment Status** (F): UNPAID, PARTIAL, PAID
- **Due Date** (G): Payment deadline
- **Payment Date** (H): When payment was made
- **Balance** (I): Amount remaining (Due - Paid)

**Example Row:**
```
MEM-0001 | John Doe | Monthly Contribution | 1000 | 1000 | PAID | 2024-05-31 | 2024-05-20 | 0
```

**Formula Tips:**
- **Balance** column: `=IF(D2>0, D2-E2, 0)`
- **Payment Status** logic:
  - If Balance = 0 → PAID
  - If Balance = Amount Due → UNPAID
  - If Balance between 0 and Amount Due → PARTIAL

---

### 3. **Events Sheet**
Records community events and notifications.

**Columns:**
- **Event Title** (A): Name of the event
- **Event Date** (B): Date of event
- **Event Time** (C): Time of event
- **Event Details** (D): Description
- **Created Date** (E): When event was created
- **Recipients Count** (F): Number of people notified

**Example Row:**
```
Annual General Meeting | 2024-06-15 | 10:00 AM | Quarterly financial review and planning | 2024-05-20 | 45
```

---

### 4. **Payments Sheet**
Temporary sheet for batch payment processing.

**Columns:**
- **Member ID** (A): Member making payment
- **Amount Paid** (B): Amount of payment
- **Payment Date** (C): When payment was made
- **Status** (D): PROCESSED or blank
- **Processed Date** (E): When it was processed

**How It Works:**
1. Enter payment information in this sheet
2. Run "Mark Payment as Paid" or batch processing
3. System automatically updates Contributions sheet
4. Marks row as PROCESSED

---

### 5. **Settings Sheet**
Configuration for the system.

**Format:** Two columns - Setting name and Value

**Required Settings:**
```
Organization Name | Your Organization Name
Treasurer Email | treasurer@email.com
Payment Instructions | Bank Account: 1234567890
Organization Description | A community organization focused on...
Website URL | https://yourorganization.com
Admin Email | admin@email.com
Form URL | https://docs.google.com/forms/d/...
```

**Tips:**
- Enter your organization details here
- Payment instructions are used in all payment reminder emails
- Admin email receives weekly reports

---

### 6. **Logs Sheet**
Automatic record of all system actions.

**Columns:**
- **Timestamp** (A): When action occurred
- **Action** (B): Type of action
- **Details** (C): Details of action
- **User** (D): Who performed the action

**Auto-Generated - Don't edit manually**

**Example Entries:**
```
2024-05-20 14:30:45 | Send Reminders | Sent 12 contribution reminders | user@gmail.com
2024-05-20 15:45:12 | Payment Marked Paid | MEM-0001, Amount: 1000 | user@gmail.com
```

---

### 7. **Archive Sheets** (Optional)
Historical data from previous years.

**Naming Convention:** `Archive_YYYY` (e.g., Archive_2023, Archive_2024)

**How Created:**
- Automatically created when archiving a year
- Contains snapshot of Contributions sheet from that year
- Kept for historical reference and auditing

---

## Setting Up Your Spreadsheet

### Step 1: Create Required Sheets
1. Open your Google Sheets document
2. Click the "+" button to add new sheets
3. Create sheets with exact names:
   - Members
   - Contributions
   - Events
   - Payments
   - Settings
   - Logs

### Step 2: Add Headers
Copy these headers to the first row of each sheet:

**Members Sheet:**
```
Member ID | Full Name | Phone Number | Email | Membership Status | Join Date | Group/Region | Notes
```

**Contributions Sheet:**
```
Member ID | Member Name | Contribution Type | Amount Due | Amount Paid | Payment Status | Due Date | Payment Date | Balance
```

**Events Sheet:**
```
Event Title | Event Date | Event Time | Event Details | Created Date | Recipients Count
```

**Payments Sheet:**
```
Member ID | Amount Paid | Payment Date | Status | Processed Date
```

**Settings Sheet:**
```
Setting | Value
```

**Logs Sheet:**
```
Timestamp | Action | Details | User
```

### Step 3: Configure Settings
1. Go to the Settings sheet
2. Add the following entries:

```
Organization Name        | Your Community Name
Treasurer Email          | treasurer@yourmail.com
Payment Instructions     | Please transfer to: [Your bank details]
Organization Description | [Brief description of your organization]
Website URL             | [Your website if applicable]
Admin Email             | [Your admin email for reports]
```

### Step 4: Add Sample Data (Optional)
Add a few test members to verify everything works:

**Members Sheet - Add:**
```
MEM-0001 | Jane Smith | +254712345678 | jane@email.com | ACTIVE | 2024-01-15 | North | 
MEM-0002 | Tom Wilson | +254723456789 | tom@email.com | ACTIVE | 2024-02-20 | South |
```

**Contributions Sheet - Add:**
```
MEM-0001 | Jane Smith | Monthly Contribution | 1000 | 500 | PARTIAL | 2024-05-31 | | 500
MEM-0002 | Tom Wilson | Monthly Contribution | 1000 | 0 | UNPAID | 2024-05-31 | | 1000
```

## Data Validation Rules

### Member ID
- Format: `MEM-XXXX` (auto-generated, don't edit)

### Email
- Must be valid email format
- Should be unique per member

### Phone Number
- Format: Include country code (e.g., +254712345678)

### Status
- Valid values: ACTIVE, INACTIVE, SUSPENDED

### Payment Status
- Valid values: PAID, UNPAID, PARTIAL, OVERDUE

### Dates
- Use MM/DD/YYYY or let Google Sheets auto-format
- Use the form's date picker for consistency

## Important Constraints

⚠️ **Don't:**
- Delete the header row
- Rename sheet names (system relies on exact names)
- Delete the Logs sheet
- Manually edit Member IDs
- Leave Email fields blank (needed for communications)

✅ **Do:**
- Keep Settings sheet updated with current information
- Archive old data yearly
- Clear old logs periodically (>30 days old)
- Backup data regularly
- Add new members via the Google Form when possible

## Data Flow Diagram

```
Google Form (Member Registration)
         ↓
    Forms.gs processes submission
         ↓
    Creates entry in Members sheet
         ↓
    Creates entry in Contributions sheet
         ↓
    Sends Welcome Email
         ↓
    Logs action in Logs sheet
```

## Capacity and Performance

- **Members:** System can handle 1,000+ members efficiently
- **Contributions:** No practical limit for rows
- **Logs:** Recommend clearing logs older than 30 days monthly
- **Sheets:** Total of ~10 sheets maximum for performance

## Troubleshooting Common Issues

**Q: Member IDs are not generating**
A: Ensure you're using the "Generate Member IDs" menu option, not manual entry.

**Q: Payment reminders not sending**
A: Check that email addresses in the Members sheet are valid and Settings sheet has valid configuration.

**Q: Form submissions not appearing**
A: Verify the form is linked to the spreadsheet and onFormSubmit trigger is active.

**Q: Old data is slowing things down**
A: Archive previous year data and clear old logs (>30 days).

---

## Next Steps
1. Create all required sheets with correct headers
2. Configure the Settings sheet with your organization information
3. Deploy the Apps Script code
4. Test with sample data
5. Create the member registration Google Form

See **DEPLOYMENT.md** for installation instructions.
