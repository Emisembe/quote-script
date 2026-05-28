# How to Use Email Automation in Google Sheets (Simple Guide)

**For people with NO programming experience** ✨

## What You'll Be Doing

You'll set up a system in Google Sheets that can send professional, personalized emails to your customers. Like a robot assistant that sends emails for you!

---

## STEP 1: Create or Open Your Google Sheet

Think of a Google Sheet like Excel, but online. 

1. Go to **Google Sheets** (sheets.google.com)
2. Create a new sheet or open an existing one
3. Your sheet should look something like this:

| Email | First Name | Quote ID | Amount |
|-------|-----------|----------|--------|
| john@example.com | John | Q-001 | 5000 |
| jane@example.com | Jane | Q-002 | 3500 |

---

## STEP 2: Open the Apps Script Editor

This is where you paste the code that sends emails.

1. In your Google Sheet, click **Extensions** (top menu)
2. Click **Apps Script**
3. A new window opens - this is your coding area

---

## STEP 3: Copy the Email Code

1. In the Apps Script window, delete any code that's there
2. Copy this code and paste it:

```javascript
// Copy the content from google-apps-script.js here
// It's the file we created for you
```

✅ **You now have the email sending system installed!**

---

## STEP 4: How to Send an Email

Let's say you want to send an email to a customer.

**In Google Sheets, create a new column called "Send Email"** and add a button that looks like this:

```javascript
function sendCustomerEmail() {
  // Initialize the email system
  const emailSystem = new BusinessEmailAutomation();

  // Get the first row from your sheet
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = sheet.getRange("A2:D2").getValues()[0]; // Row 2 of your sheet

  // Send the email
  const result = emailSystem.sendEmail(
    data[0],  // Email address (column A)
    "quote-sent",  // Template name (we created 3: "quote-sent", "follow-up", "special-offer")
    "default",  // Business name (or "acme-corp", etc.)
    "Your Quote is Ready!",  // Email subject
    {
      firstName: data[1],  // First name (column B)
      quoteId: data[2],  // Quote ID (column C)
      totalAmount: data[3],  // Amount (column D)
      quoteLink: "https://yourwebsite.com/quotes"
    }
  );

  // Show if it worked
  if (result.success) {
    alert("✅ Email sent!");
  } else {
    alert("❌ Error: " + result.error);
  }
}
```

---

## The 3 Email Templates You Have (Ready to Use)

### Template 1: "quote-sent"
Used when you send a quote to a customer

**Data you need to provide:**
- `firstName` - Their first name
- `quoteId` - The quote number (like Q-001)
- `quoteDate` - When you sent it
- `totalAmount` - How much it costs
- `quoteLink` - Link to the full quote

### Template 2: "follow-up"
Used when you want to follow up after sending a quote

**Data you need to provide:**
- `firstName` - Their first name
- `quoteId` - The quote number
- `calendarLink` - Link to schedule a meeting (like Calendly)

### Template 3: "special-offer"
Used to send promotional offers

**Data you need to provide:**
- `firstName` - Their first name
- `offerTitle` - What's the offer? (like "30% Off")
- `offerDescription` - Details about the offer
- `offerExpiry` - When does it expire?
- `offerLink` - Where they can claim it

---

## HOW TO ADD YOUR OWN EMAIL TEMPLATE (Simple Way)

**Example: You want a "Thank You" template**

1. In Apps Script, add this function:

```javascript
function addThankYouTemplate() {
  const emailSystem = new BusinessEmailAutomation();
  
  // This is the HTML code for your new email
  const thankYouEmail = `
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px;">
          <h1>Thank You, {{firstName}}!</h1>
          
          <p>We appreciate your business and are excited to work with you.</p>
          
          <p>If you have any questions, feel free to contact us:</p>
          
          <p>
            📧 {{businessEmail}}<br>
            📞 {{businessPhone}}<br>
            🌐 {{businessWebsite}}
          </p>
          
          <p>Best regards,<br>{{businessName}}</p>
        </div>
      </body>
    </html>
  `;
  
  // Add the template
  emailSystem.addTemplate("thank-you", thankYouEmail);
  alert("✅ Template added!");
}
```

2. Click **Run** button
3. Now you can use template named "thank-you" in your emails!

---

## HOW TO ADD YOUR OWN BUSINESS (Simple Way)

**Example: You want to add "Pizza Palace" as a business**

1. In Apps Script, add this function:

```javascript
function addPizzaPalaceBusiness() {
  const emailSystem = new BusinessEmailAutomation();
  
  emailSystem.addBusiness("pizza-palace", {
    name: "Pizza Palace",
    email: "orders@pizzapalace.com",
    phone: "+1 (555) 999-8888",
    website: "https://pizzapalace.com",
    colors: {
      primary: "#d32f2f",  // Red
      accent: "#ffb300"    // Gold
    }
  });
  
  alert("✅ Pizza Palace added!");
}
```

2. Click **Run** button
3. Now use it like: `"pizza-palace"` instead of `"default"`

---

## COLORS EXPLAINED (For Email Design)

Colors are in "hex codes" - they look like #FF0000 (red)

**Some common colors:**
- `#0066cc` - Blue
- `#ff0000` - Red
- `#00aa00` - Green
- `#ffaa00` - Orange
- `#1a1a1a` - Dark gray
- `#ffffff` - White

Just change the color codes in the colors section!

---

## CONNECTING IT TO YOUR SHEET (Using a Button)

Want to send an email with one click?

1. In Google Sheets, select a cell
2. Click **Insert → Function → Custom function**
3. Type `=SENDQUOTE(A2, B2, C2, D2)` 
4. This will run your function

Or add a button:
1. Click **Insert → Button**
2. Connect it to your `sendCustomerEmail()` function
3. Click the button to send!

---

## Using Sheet Names vs Manual Emails

### Option A: Pull from a Sheet (Automated)
Read names and emails from your sheet and send to many people at once

### Option B: Manual (One-by-one)
Type each email manually in the code

**Most people start with Option B, then upgrade to Option A later.**

---

## Troubleshooting

### ❌ "Email not sent" or error appears

**Check this:**
1. Make sure the email address is valid
2. Make sure the template name exists (quote-sent, follow-up, special-offer)
3. Make sure all the data fields {{firstName}} have values

### ❌ "Gmail permission denied"

**Fix:**
1. Apps Script will ask for permission the first time
2. Click "Review Permissions"
3. Click your Google Account
4. Click "Allow"

### ❌ Email looks ugly or broken

**Check:**
1. All {{variables}} were replaced with actual data
2. No typos in variable names
3. All required fields are provided

---

## Real Example: Sending Quote Emails

Your sheet:
```
Email | Name | Quote ID | Amount
john@example.com | John | Q-001 | $5,000
```

Your code:
```javascript
function sendQuoteToJohn() {
  const emailSystem = new BusinessEmailAutomation();
  
  emailSystem.sendEmail(
    "john@example.com",
    "quote-sent",
    "default",
    "Your Quote is Ready!",
    {
      firstName: "John",
      quoteId: "Q-001",
      quoteDate: "May 27, 2026",
      totalAmount: "5,000",
      quoteLink: "https://example.com/quotes/Q-001"
    }
  );
}
```

✅ John gets a beautiful email!

---

## Next Steps

1. ✅ Install the code in Apps Script
2. ✅ Add your business info to the code
3. ✅ Test sending one email
4. ✅ Create a button in your sheet
5. ✅ Send emails to customers!

**Questions? The code is designed to be simple - just fill in the {{brackets}} with your info!**
