# 🚀 ULTIMATE Email Automation System

**Professional grade - with sheet preparation, custom messages, and rich templates with videos/links**

---

## What's New & Awesome

### ✨ Feature 1: One-Click Sheet Preparation
A button that **auto-creates** a perfectly formatted data entry sheet with all the columns you need!

### ✨ Feature 2: Custom Messages From Sheet
Each customer can have a **personalized message** pulled directly from your data sheet!

### ✨ Feature 3: Rich Email Templates
Add **videos, links, images** - edit templates with full HTML/CSS control!

---

## Installation

1. Open Google Sheets
2. Go to **Extensions → Apps Script**
3. Delete existing code
4. Copy-paste from: **`google-apps-script-ultimate.js`**
5. Click **Save**
6. Refresh your Google Sheet

---

## 🎯 Feature 1: One-Click Sheet Preparation

### What It Does

Clicking **ONE BUTTON** creates a perfectly formatted data sheet with:
- All the columns you need
- Sample data to show how it works
- Proper formatting and spacing

### How to Use

1. Click **📧 Email Tools → 🆕 Prepare Email Campaign Sheet**
2. A dialog says: "✅ Sheet created!"
3. Look at the bottom - you see new tab: **"📧 Email Campaign Data"**
4. It has columns:

```
📧 Email Campaign Data Sheet (auto-created)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email          | First Name | Company   | Quote ID
john@example   | John       | ACME Inc  | Q-001
jane@example   | Jane       | Tech Co   | Q-002
```

### Columns Included

| Column | What It's For | Example |
|--------|---------------|---------|
| **Email** | Customer email | john@example.com |
| **First Name** | Customer name | John |
| **Last Name** | (optional) | Smith |
| **Company** | (optional) | ACME Corp |
| **Quote ID** | Quote number | Q-001 |
| **Amount** | How much? | 5000 |
| **Custom Message** | Personal note! | "John, this has a special offer for VIP clients!" |
| **Video URL** | Link to video | https://youtube.com/embed/xyz |
| **Link URL** | Link to click | https://example.com/demo |
| **Notes** | Internal notes | "Hot lead", "Follow up Friday" |

### Example Sheet

```
Email              | First Name | Company      | Quote ID | Amount | Custom Message
john@example.com   | John       | ACME Inc     | Q-001    | 5000   | John, as a VIP client, here's an exclusive offer!
jane@example.com   | Jane       | Tech Start   | Q-002    | 7500   | Jane, thanks for your interest in our service!
bob@example.com    | Bob        | BigCorp     | Q-003    | 12000  | Bob, we custom-built this for your needs
```

Just **fill in your customers** and you're ready to send!

---

## 🎯 Feature 2: Custom Messages From Sheet

### What Are Custom Messages?

Each customer gets a **personalized message** that appears in their email!

### Example

**Your Sheet:**
```
First Name | Custom Message
John       | John, we have a special offer just for VIP clients like you!
Jane       | Jane, thanks for being a loyal customer!
Bob        | Hi Bob, I've prepared this custom quote based on your needs.
```

**What They Receive:**
```
Hi John,

Thank you for reaching out! We're excited to provide you with a quote.

💬 John, we have a special offer just for VIP clients like you!

Quote ID: Q-001
Amount: $5000
```

The custom message appears in a highlighted box!

### How to Use It

1. **Click 🆕 Prepare Email Campaign Sheet**
2. **Fill in the "Custom Message" column** for each customer
3. **Import the sheet** (📋 Import from Sheets)
4. **Send emails** - custom messages auto-included!

### Real Examples

**Example 1: Sales Email**
```
Custom Message: "John, I saw your company is expanding. 
I think our service would be perfect for your new team!"
```

**Example 2: Follow-up**
```
Custom Message: "Jane, it's been a week since we sent the quote. 
I wanted to check if you have any questions?"
```

**Example 3: VIP Treatment**
```
Custom Message: "Bob, as one of our top clients, 
I've included an exclusive discount just for you."
```

---

## 🎯 Feature 3: Rich Email Templates (Videos & Links)

### What Can You Add?

✅ **Videos** (YouTube, Vimeo embeds)  
✅ **Links** (clickable buttons and text links)  
✅ **Images** (company logos, product images)  
✅ **Styling** (colors, fonts, spacing)  
✅ **Dynamic content** (pulls from your data)  

### Pre-Built Rich Template: Video Demo

You now have a **"video-demo"** template!

**What It Looks Like:**
```
📧 Email: Check Out Our Demo Video
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Hi John,

I wanted to show you a quick demo of our service!

[VIDEO PLAYS HERE]

This shows how to use the features.

💬 John, I think you'll love this feature!

[Learn More Button]
```

### Using the Video Template

1. Click **✉️ Email Tools → ✉️ Send Email**
2. Select Template: **"video-demo"**
3. In "Additional Data" add:
```json
{
  "videoUrl": "https://www.youtube.com/embed/dQw4w9WgXcQ",
  "demoLink": "https://example.com/demo",
  "quoteId": "Q-001"
}
```
4. Click **📤 Send Email**
5. ✅ Email includes embedded video!

### How to Edit Templates

**Want to customize the video template?**

1. Click **🎨 Manage Templates**
2. Click **✏️ Edit Template** tab
3. Select **"video-demo"**
4. Edit the HTML code
5. Click **💾 Save Changes**

### How to Create Your Own Rich Template

**Example: Quote with Video AND Custom Message**

1. Click **🎨 Manage Templates**
2. Click **➕ Create New** tab
3. **Template Name:** "quote-with-video"
4. **HTML Code:**

```html
<html>
  <body style="font-family: Arial, sans-serif; padding: 20px;">
    <h1>Hi {{firstName}},</h1>

    <!-- Custom message from sheet -->
    {{#if customMessage}}
      <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px;">
        <p>{{customMessage}}</p>
      </div>
    {{/if}}

    <!-- Embedded video -->
    {{#if videoUrl}}
      <div style="margin: 20px 0;">
        <iframe width="100%" height="315" 
          src="{{videoUrl}}" 
          frameborder="0" 
          allow="accelerometer; autoplay; clipboard-write" 
          allowfullscreen>
        </iframe>
      </div>
    {{/if}}

    <!-- Quote info -->
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p><strong>Quote ID:</strong> {{quoteId}}</p>
      <p><strong>Amount:</strong> ${{totalAmount}}</p>
    </div>

    <!-- Link button -->
    <p><a href="{{quoteLink}}" 
      style="background-color: #0066cc; color: white; padding: 10px 20px; 
             text-decoration: none; border-radius: 5px;">
      View Full Quote
    </a></p>

    <p>Best regards,<br>{{businessName}}</p>
  </body>
</html>
```

5. Click **✅ Create Template**
6. Now you have a new "quote-with-video" template!

---

## 📝 Template Variables You Can Use

### Always Available (Auto-filled)

```
{{firstName}}           → John
{{customMessage}}       → Custom message from your sheet
{{businessName}}        → Your company name
{{businessEmail}}       → Your email
{{businessPhone}}       → Your phone
{{businessWebsite}}     → Your website
{{primaryColor}}        → Your brand color
{{accentColor}}         → Your highlight color
```

### Add In "Additional Data" (When Sending)

```json
{
  "quoteId": "Q-001",
  "totalAmount": "5000",
  "quoteDate": "May 28, 2026",
  "quoteLink": "https://example.com/quotes/Q-001",
  "videoUrl": "https://youtube.com/embed/abc123",
  "demoLink": "https://example.com/demo",
  "calendarLink": "https://calendly.com/user",
  "offerTitle": "30% Off",
  "offerDescription": "Limited time offer",
  "offerExpiry": "June 3, 2026",
  "anyCustomField": "Your value"
}
```

### Conditional Content

```html
{{#if customMessage}}
  <p>This only shows if customMessage exists</p>
{{/if}}

{{#if videoUrl}}
  <iframe src="{{videoUrl}}"></iframe>
{{/if}}
```

---

## 🎬 Real Example: Product Demo Email

### Your Sheet Has:
```
Email          | First Name | Company     | Custom Message
john@email     | John       | TechCorp    | John, I made a video showing how this works for your industry!
```

### You Create Template "Demo"

```html
<html>
  <body style="font-family: Arial; padding: 30px;">
    <h1>Hey {{firstName}},</h1>

    <p>I wanted to walk you through our solution!</p>

    {{#if customMessage}}
      <div style="background: #fff3cd; padding: 15px; border-radius: 5px;">
        💬 {{customMessage}}
      </div>
    {{/if}}

    <h3>Watch the 2-minute demo:</h3>

    {{#if videoUrl}}
      <iframe width="100%" height="400" 
        src="{{videoUrl}}" 
        frameborder="0" 
        allow="accelerometer; autoplay" 
        allowfullscreen>
      </iframe>
    {{/if}}

    <p>Key features covered:</p>
    <ul>
      <li>Automated workflows</li>
      <li>Real-time analytics</li>
      <li>Easy integrations</li>
    </ul>

    {{#if demoLink}}
      <p>
        <a href="{{demoLink}}" 
          style="background: #0066cc; color: white; padding: 12px 30px; 
                 text-decoration: none; border-radius: 5px; display: inline-block;">
          Start Free Trial
        </a>
      </p>
    {{/if}}

    <p>Questions? Let me know!<br>
    {{businessName}}<br>
    {{businessEmail}}</p>
  </body>
</html>
```

### Sending The Email

1. Click **✉️ Send Email**
2. Select: John (john@email)
3. Template: "Demo"
4. Subject: "Check Out This Demo - Just For You"
5. Additional Data:
```json
{
  "videoUrl": "https://www.youtube.com/embed/abc123",
  "demoLink": "https://example.com/free-trial"
}
```
6. Click **📤 Send Email**

### What John Receives

```
Hey John,

I wanted to walk you through our solution!

💬 John, I made a video showing how this works for your industry!

Watch the 2-minute demo:

[VIDEO EMBEDDED HERE]

Key features covered:
• Automated workflows
• Real-time analytics
• Easy integrations

[Start Free Trial Button]

Questions? Let me know!
Tech Solutions Inc
sales@techsolutions.com
```

---

## 📊 Workflow: Complete Email Campaign

### Step 1: Prepare Sheet
1. Click **🆕 Prepare Email Campaign Sheet**
2. ✅ Sheet created with all columns!

### Step 2: Fill In Data
1. Open the **"📧 Email Campaign Data"** sheet
2. Add your customers:
   - Email
   - First Name
   - Company
   - Custom Message (your personal note!)
   - Quote ID
   - Amount
   - etc.

### Step 3: Setup Business
1. Click **⚙️ Setup Business Info**
2. Enter your company details, colors, etc.

### Step 4: Create Custom Template
1. Click **🎨 Manage Templates**
2. Click **➕ Create New**
3. Add a template with {{variables}} and HTML

### Step 5: Import Data
1. Click **📋 Import from Sheets**
2. Select your "📧 Email Campaign Data" sheet
3. ✅ Customers imported!

### Step 6: Send Emails
1. Click **✉️ Send Email**
2. Pick customer
3. Pick template
4. Add any extra data (video URL, links, etc.)
5. Click **👁️ Preview** to check
6. Click **📤 Send Email**
7. ✅ Logs automatically!

### Step 7: Monitor
1. Click **📊 Email Stats Dashboard**
2. See how many sent, remaining quota, etc.
3. Click **📋 View Email Logs**
4. Check the "📊 Email Logs" sheet for all details

---

## 💡 Pro Tips

### Tip 1: Store Videos in Sheet Column
Add video URLs directly in your sheet under "Video URL" column!
```
Custom Message | Video URL
"Watch this!" | https://youtube.com/embed/abc123
```

### Tip 2: Use Conditionals for Flexibility
```html
{{#if videoUrl}}
  <!-- Show video if URL exists -->
  <iframe src="{{videoUrl}}"></iframe>
{{/if}}

{{#if customMessage}}
  <!-- Show message if it exists -->
  <p>{{customMessage}}</p>
{{/if}}
```

### Tip 3: Design Responsive Emails
```html
<table width="100%" style="max-width: 600px;">
  <tr>
    <td>
      <!-- Content here -->
    </td>
  </tr>
</table>
```

### Tip 4: Track Performance
Use your custom message strategically:
- "VIP Customers get:" for VIP emails
- "Custom Quote for:" for personalization
- "Special timing:" if time-sensitive

Then check logs to see which groups respond!

---

## 📚 Templates You Have Pre-Built

| Template | Use For | Features |
|----------|---------|----------|
| **quote-sent** | Send quotes | Custom message box |
| **follow-up** | Follow ups | Custom message + calendar link |
| **special-offer** | Promotions | Custom message + highlight box |
| **video-demo** | NEW! Product demo | Embedded video + link button |

---

## Troubleshooting

### ❓ Custom message doesn't show
→ Make sure column is named exactly "Custom Message"
→ Make sure you imported it properly

### ❓ Video doesn't embed
→ Use proper YouTube embed URL: `https://youtube.com/embed/VIDEO_ID`
→ Don't use regular share URL

### ❓ Link doesn't work
→ Check URL has "https://" at the start
→ Make sure {{demoLink}} variable is provided

### ❓ Template looks ugly
→ Click **👁️ Preview** before sending
→ Check HTML syntax (all tags closed)

---

## Summary

✅ **Auto Sheet Creation** - One click, perfectly formatted  
✅ **Custom Messages** - Personal note for each customer  
✅ **Rich Templates** - Videos, links, images, styling  
✅ **Conditional Content** - Show/hide based on data  
✅ **Professional Emails** - Looks amazing in inbox  

You now have **enterprise-grade email automation**! 🚀
