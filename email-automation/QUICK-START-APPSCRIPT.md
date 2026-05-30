# Quick Start: Google Sheets + Apps Script (Visual Guide)

## The Big Picture

```
Your Google Sheet (with customer data)
        ↓
   Apps Script (the code)
        ↓
   Gmail (sends emails)
```

---

## STEP-BY-STEP VISUAL GUIDE

### STEP 1️⃣ Open Your Google Sheet

Go to **sheets.google.com** and open (or create) a spreadsheet.

Your sheet should have columns like:
```
A          B            C          D
Email      First Name   Quote ID   Amount
----       ----------   --------   ------
john@...   John         Q-001      5000
```

---

### STEP 2️⃣ Open Apps Script Editor

**Click this path in your Google Sheet:**

```
Top Menu: Extensions → Apps Script
```

You'll see a screen that looks like a code editor. It might have some pre-written code - delete it.

---

### STEP 3️⃣ Copy-Paste the Code

Here's the COMPLETE code to paste into Apps Script:

```javascript
// ===== EMAIL AUTOMATION FOR GOOGLE APPS SCRIPT =====

class BusinessEmailAutomation {
  constructor() {
    this.businesses = {
      "default": {
        name: "Your Business Name",
        email: "your-email@example.com",
        phone: "+1 (555) 000-0000",
        website: "https://yourwebsite.com",
        colors: {
          primary: "#0066cc",
          accent: "#ff6600"
        }
      }
    };

    this.templates = {
      "quote-sent": this.getQuoteSentTemplate(),
      "follow-up": this.getFollowUpTemplate(),
      "special-offer": this.getSpecialOfferTemplate()
    };
  }

  getQuoteSentTemplate() {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="background-color: {{primaryColor}}; color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0;">{{businessName}}</h1>
              <p style="margin: 10px 0 0 0; font-size: 14px;">Your Quote is Ready!</p>
            </div>
            <div style="padding: 30px;">
              <p style="font-size: 18px; font-weight: bold; color: #333;">Hi {{firstName}},</p>
              <p style="color: #666; line-height: 1.6;">Thank you for reaching out to {{businessName}}! We're excited to provide you with a quote tailored to your needs.</p>
              <div style="background-color: #f5f5f5; border-left: 4px solid {{accentColor}}; padding: 15px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Quote ID:</strong> {{quoteId}}</p>
                <p style="margin: 5px 0;"><strong>Date:</strong> {{quoteDate}}</p>
                <p style="margin: 5px 0;"><strong>Total:</strong> ${{totalAmount}}</p>
              </div>
              <p style="color: #666; line-height: 1.6;">Please review the attached quote. If you have any questions, feel free to reach out to us.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{quoteLink}}" style="background-color: {{primaryColor}}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Full Quote</a>
              </div>
            </div>
            <div style="background-color: #f9f9f9; padding: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; text-align: center;">
              <p style="margin: 5px 0;">📧 {{businessEmail}} | 📞 {{businessPhone}}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  getFollowUpTemplate() {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden;">
            <div style="background-color: {{primaryColor}}; color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0;">{{businessName}}</h1>
              <p style="margin: 10px 0 0 0; font-size: 14px;">Following Up</p>
            </div>
            <div style="padding: 30px;">
              <p style="font-size: 18px; font-weight: bold; color: #333;">Hi {{firstName}},</p>
              <p style="color: #666; line-height: 1.6;">I hope this finds you well! I wanted to follow up on the quote {{quoteId}} we shared with you.</p>
              <p style="color: #666; line-height: 1.6;">If you have any questions or would like to discuss, I'm here to help!</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{calendarLink}}" style="background-color: {{primaryColor}}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Schedule a Call</a>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  getSpecialOfferTemplate() {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, {{primaryColor}}, {{accentColor}}); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 32px;">🎉 SPECIAL OFFER</h1>
            </div>
            <div style="padding: 30px;">
              <p style="font-size: 18px; font-weight: bold; color: #333;">Hi {{firstName}},</p>
              <p style="color: #666; line-height: 1.6;">We have an exclusive offer just for you!</p>
              <div style="background-color: #fff3cd; border: 2px solid {{accentColor}}; border-radius: 5px; padding: 20px; margin: 20px 0; text-align: center;">
                <p style="font-size: 24px; font-weight: bold; color: {{primaryColor}}; margin: 10px 0;">{{offerTitle}}</p>
                <p style="font-size: 14px; color: #666;">{{offerDescription}}</p>
                <p style="font-size: 12px; color: #666;"><strong>Valid until:</strong> {{offerExpiry}}</p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{offerLink}}" style="background-color: {{primaryColor}}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Claim Offer</a>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  sendEmail(recipientEmail, templateName, businessKey, emailSubject, data) {
    try {
      if (!this.businesses[businessKey]) {
        throw new Error(`Business "${businessKey}" not found`);
      }
      if (!this.templates[templateName]) {
        throw new Error(`Template "${templateName}" not found`);
      }

      const business = this.businesses[businessKey];
      const template = this.templates[templateName];

      const emailData = {
        ...data,
        businessName: business.name,
        businessEmail: business.email,
        businessPhone: business.phone,
        businessWebsite: business.website,
        primaryColor: business.colors.primary,
        accentColor: business.colors.accent
      };

      let htmlContent = template;
      Object.keys(emailData).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        htmlContent = htmlContent.replace(regex, emailData[key] || '');
      });

      GmailApp.sendEmail(recipientEmail, emailSubject, '', { htmlBody: htmlContent });
      return { success: true, message: `Email sent to ${recipientEmail}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  addTemplate(templateName, htmlContent) {
    this.templates[templateName] = htmlContent;
    return { success: true, message: `Template added` };
  }

  addBusiness(businessKey, businessData) {
    this.businesses[businessKey] = businessData;
    return { success: true, message: `Business added` };
  }
}

// ===== YOUR EMAIL FUNCTIONS =====

function testEmail() {
  const emailSystem = new BusinessEmailAutomation();
  
  const result = emailSystem.sendEmail(
    "your-email@gmail.com",  // CHANGE THIS TO YOUR EMAIL
    "quote-sent",
    "default",
    "Test Quote Email",
    {
      firstName: "John",
      quoteId: "Q-001",
      quoteDate: "May 27, 2026",
      totalAmount: "5000",
      quoteLink: "https://example.com"
    }
  );
  
  if (result.success) {
    console.log("✅ Test email sent!");
  } else {
    console.log("❌ Error: " + result.error);
  }
}
```

✅ **Paste the code above into Apps Script**

---

### STEP 4️⃣ Update Your Business Name

In the code, find this part:

```javascript
this.businesses = {
  "default": {
    name: "Your Business Name",      // ← CHANGE THIS
    email: "your-email@example.com",  // ← CHANGE THIS
    phone: "+1 (555) 000-0000",       // ← CHANGE THIS
    website: "https://yourwebsite.com", // ← CHANGE THIS
```

Change it to YOUR business info. For example:

```javascript
this.businesses = {
  "default": {
    name: "ACME Corporation",
    email: "sales@acme.com",
    phone: "+1 (555) 123-4567",
    website: "https://acme.com",
```

---

### STEP 5️⃣ Test It Works

1. In the top of Apps Script, click the dropdown that says "Select function"
2. Select **testEmail**
3. Click the ▶️ **Run** button
4. First time: It will ask for **permission to use Gmail** - click **Allow**
5. ✅ If you see "✅ Test email sent!" in the console, it works!

---

## Now You Can Send Real Emails! 

### Example: Send a Quote Email

```javascript
function sendQuoteEmail() {
  const emailSystem = new BusinessEmailAutomation();
  
  emailSystem.sendEmail(
    "customer@example.com",  // Who gets the email
    "quote-sent",            // Which template
    "default",               // Which business
    "Your Quote is Ready!",  // Email subject
    {
      firstName: "John",          // Replace {{firstName}} 
      quoteId: "Q-001",           // Replace {{quoteId}}
      quoteDate: "May 27, 2026",  // Replace {{quoteDate}}
      totalAmount: "5000",        // Replace {{totalAmount}}
      quoteLink: "https://example.com/quotes/Q-001"  // Replace {{quoteLink}}
    }
  );
}
```

**Just change the values in the `{` `}` brackets!**

---

## How to Add a NEW Template

Want to add a "Thank You" email?

```javascript
// Add this function to your Apps Script code:

function addThankYouTemplate() {
  const emailSystem = new BusinessEmailAutomation();
  
  const html = `
    <html>
      <body style="font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 30px;">
          <h1>Thank You, {{firstName}}!</h1>
          <p>We appreciate your business!</p>
          <p>Contact us: {{businessEmail}}</p>
        </div>
      </body>
    </html>
  `;
  
  emailSystem.addTemplate("thank-you", html);
}
```

Click **Run** and your "thank-you" template is created!

Then use it:
```javascript
emailSystem.sendEmail(
  "customer@example.com",
  "thank-you",  // ← Use your new template
  "default",
  "Thank You!",
  { firstName: "John" }
);
```

---

## How to Add a NEW Business

Want to send emails from another company?

```javascript
function addNewBusiness() {
  const emailSystem = new BusinessEmailAutomation();
  
  emailSystem.addBusiness("pizza-shop", {
    name: "Pizza Palace",
    email: "orders@pizzapalace.com",
    phone: "+1 (555) 999-8888",
    website: "https://pizzapalace.com",
    colors: {
      primary: "#d32f2f",   // Red
      accent: "#ffb300"     // Gold
    }
  });
}
```

Click **Run** and now you can use:
```javascript
emailSystem.sendEmail(
  "customer@example.com",
  "quote-sent",
  "pizza-shop",  // ← Use the new business
  "Your Pizza Quote!",
  { firstName: "John", ... }
);
```

---

## Sending Emails from a Google Sheet (Advanced)

Want a button in your sheet to send emails?

```javascript
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Email Tools')
    .addItem('Send Quote Email', 'sendQuoteFromSheet')
    .addToUi();
}

function sendQuoteFromSheet() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = sheet.getRange("A2:D2").getValues()[0];
  
  const emailSystem = new BusinessEmailAutomation();
  
  emailSystem.sendEmail(
    data[0],  // Column A: Email
    "quote-sent",
    "default",
    "Your Quote from ACME",
    {
      firstName: data[1],     // Column B: Name
      quoteId: data[2],       // Column C: Quote ID
      totalAmount: data[3],   // Column D: Amount
      quoteDate: new Date().toLocaleDateString(),
      quoteLink: "https://example.com"
    }
  );
  
  alert("✅ Email sent!");
}
```

Now you'll see an "Email Tools" menu in your sheet with a "Send Quote Email" button!

---

## Summary

| What | Where |
|------|-------|
| Code | Apps Script (Extensions → Apps Script) |
| Customer Data | Google Sheet columns |
| Email Templates | In the code (quote-sent, follow-up, special-offer) |
| Businesses | In the code (default, or add more) |
| Send Email | Click button or run function |

---

## Troubleshooting

**❌ "Gmail permission denied"**
→ Click Allow when Google asks for permission

**❌ Email not sent**
→ Check email address is correct: john@example.com (not john@example)

**❌ Can't find Apps Script**
→ In Google Sheet, go to: **Extensions** → **Apps Script**

**❌ Template variables not replaced**
→ Check spelling: `{{firstName}}` not `{{firstname}}` (capital F!)

**That's it! You now have a professional email automation system! 🎉**
