# 🎯 User-Friendly Email Automation (NO CODE NEEDED!)

**This is the easy version - just click buttons and fill in forms!**

---

## Installation (One-Time Setup)

### Step 1: Open Your Google Sheet
Go to **sheets.google.com** and open your spreadsheet with customer data.

### Step 2: Open Apps Script
In Google Sheets, click: **Extensions → Apps Script**

### Step 3: Copy the Code
Delete any existing code and copy-paste **ALL of this**:

👉 **From file:** `google-apps-script-advanced.js`

### Step 4: Save It
Click the **Save** button (💾) in Apps Script

### Step 5: Refresh Your Google Sheet
Go back to Google Sheets and refresh the page (F5 or Cmd+R)

### Step 6: You'll See a New Menu!
Look at the top menu bar - you should see: **📧 Email Tools**

---

## Your New Menu (Click These!)

When you click "📧 Email Tools" you get these options:

```
⚙️ Setup Business Info     → Configure your business details
📋 Import Customer Sheet   → Load customer data from your sheet
✉️ Send Email to Customer  → Send an email to one person
🎨 Manage Email Templates  → Edit/create email templates
📧 View Businesses         → See your saved businesses
📧 View Templates          → See all templates
```

---

## HOW TO USE (Step by Step)

### 🔧 FIRST TIME: Setup Your Business

1. Click **📧 Email Tools → ⚙️ Setup Business Info**
2. A form appears. Fill in:
   - **Business Name:** "Your Company Name"
   - **Email Address:** "your-email@company.com"
   - **Phone Number:** "+1 (555) 000-0000"
   - **Website:** "https://yourwebsite.com"
   - **Primary Color:** Pick a blue color
   - **Accent Color:** Pick an orange/highlight color
3. Click **💾 Save Business Info**
4. ✅ Done!

---

### 📋 SECOND: Import Your Customer Data

Your Google Sheet should have customer columns:

```
Column A: Email          | Column B: First Name | Column C: Quote ID
john@example.com         | John                 | Q-001
jane@example.com         | Jane                 | Q-002
```

**To import:**

1. Click **📧 Email Tools → 📋 Import Customer Sheet**
2. A dialog appears:
   - **Select a Sheet:** Choose the sheet with customer data
   - **Column for Email:** Type "Email" (or "A")
   - **Column for First Name:** Type "First Name" (or "B")
3. Click **📥 Import Sheet**
4. ✅ You'll see: "Imported X customers!"

---

### ✉️ SEND AN EMAIL

Now you can send beautiful emails!

1. Click **📧 Email Tools → ✉️ Send Email to Customer**
2. A dialog appears:
   - **Select Customer:** Choose who to send to (John, Jane, etc.)
   - **Email Template:** Choose a design
     - "quote-sent" = Send a quote
     - "follow-up" = Follow up on a quote
     - "special-offer" = Send a promotion
   - **Business:** Choose "default" (or another if you added one)
   - **Email Subject:** Type what appears in the inbox
     - Example: "Your Quote is Ready!" 
   - **Additional Data:** (Optional) Add special values in JSON format:
     ```json
     {"quoteId": "Q-001", "totalAmount": "5000"}
     ```

3. **Optional: Click 👁️ Preview** to see how it looks
4. Click **📤 Send Email**
5. ✅ Email sent!

---

### 🎨 CREATE OR EDIT EMAIL TEMPLATES

Want a custom email design?

**OPTION A: Edit an Existing Template**

1. Click **📧 Email Tools → 🎨 Manage Email Templates**
2. Click **✏️ Edit Template** tab
3. **Select Template to Edit:** Choose "quote-sent" or another
4. Edit the HTML code (the email design)
5. Click **💾 Save Changes**
6. ✅ Done!

**OPTION B: Create a Completely New Template**

1. Click **📧 Email Tools → 🎨 Manage Email Templates**
2. Click **➕ Create New** tab
3. **Template Name:** Type a name (e.g., "thank-you")
4. **Template HTML Code:** Paste your HTML
   ```html
   <html>
     <body style="font-family: Arial, sans-serif; padding: 30px;">
       <h1>Thank You, {{firstName}}!</h1>
       <p>We appreciate your business!</p>
       <p>Contact us: {{businessEmail}}</p>
     </body>
   </html>
   ```
5. Click **✅ Create Template**
6. ✅ Your new template is ready!

---

## Special {{Variables}} You Can Use

These are automatically filled from your data:

```
{{firstName}}          → Customer's first name
{{businessName}}       → Your business name
{{businessEmail}}      → Your business email
{{businessPhone}}      → Your business phone
{{businessWebsite}}    → Your business website
{{primaryColor}}       → Your primary color
{{accentColor}}        → Your accent color
```

**Custom variables you provide:**

```
{{quoteId}}            → Add in "Additional Data": {"quoteId": "Q-001"}
{{totalAmount}}        → Add in "Additional Data": {"totalAmount": "5000"}
{{customMessage}}      → Add any custom field you want!
```

---

## Real Example: Send a Quote Email

**Your Sheet:**
```
Email              | First Name
john@example.com   | John
```

**Steps:**
1. Click **📧 Email Tools → ✉️ Send Email to Customer**
2. Select Customer: **John (john@example.com)**
3. Email Template: **quote-sent**
4. Business: **default**
5. Email Subject: **Your Quote from ACME Corp**
6. Additional Data:
   ```json
   {"quoteId": "Q-001", "totalAmount": "5000", "quoteDate": "May 27, 2026"}
   ```
7. Click **📤 Send Email**

✅ John gets a beautiful formatted email!

---

## HTML Email Design (If You Want to Edit)

Basic template structure:

```html
<html>
  <body style="font-family: Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white;">
      
      <!-- Header -->
      <div style="background-color: {{primaryColor}}; color: white; padding: 30px;">
        <h1>{{businessName}}</h1>
      </div>

      <!-- Content -->
      <div style="padding: 30px;">
        <p>Hi {{firstName}},</p>
        <p>Your custom message here.</p>
      </div>

      <!-- Footer -->
      <div style="background-color: #f5f5f5; padding: 20px; border-top: 1px solid #ddd;">
        <p>{{businessEmail}}</p>
        <p>{{businessPhone}}</p>
      </div>

    </div>
  </body>
</html>
```

---

## Common Tasks

### ❓ How do I add a second business?

Currently the system uses one business (default). To add more businesses, you'll need to click "Edit Template" and modify the code slightly. But for most users, one business is fine!

### ❓ How do I send to MANY people at once?

Right now you send one at a time. To send bulk emails:
1. Import your sheet
2. Send to Customer #1
3. Send to Customer #2
4. etc.

(If you need automatic bulk sending, we can add that later!)

### ❓ Can I use my own email design?

Yes! You can:
1. Create a custom HTML template
2. Add your own styling, colors, logos
3. Just make sure to use {{variables}} for dynamic content

### ❓ What if I make a mistake?

The emails preview before sending, so:
1. Click **👁️ Preview** before sending
2. Check it looks right
3. Then click **📤 Send Email**

If something's wrong, just don't send it!

---

## Troubleshooting

### ❌ "Please import customer data first!"
→ You haven't imported your sheet yet. Do Step 2 first.

### ❌ "Gmail permission denied"
→ Google will ask for permission once. Click "Allow" when it appears.

### ❌ Email doesn't look right
→ Click **👁️ Preview** first to see how it looks before sending.

### ❌ Template variables like {{firstName}} don't show
→ Check spelling: capital F in {{firstName}}, not {{firstname}}

### ❌ Menu doesn't appear
→ Refresh Google Sheets (F5). Wait 10 seconds. Try again.

---

## What You DON'T Need to Do

❌ Edit code
❌ Use terminal or command line
❌ Understand JavaScript
❌ Manage servers
❌ Configure anything technical

✅ Just click menus and fill in forms!

---

## Next Steps

1. ✅ Copy the code and save it
2. ✅ Setup your business info
3. ✅ Import your customer data
4. ✅ Send your first email!
5. ✅ Customize templates if you want

**You now have a professional email automation system!** 🎉
