# ⚙️ Email Configuration Guide

This guide explains how to customize your business information that appears in all email footers.

---

## Quick Configuration

All email templates now include a **professional footer** with your company information, social media links, and app download buttons.

### Step 1: Open the Apps Script Editor

1. In Google Sheets: **Extensions → Apps Script**
2. Look for the file `google-apps-script-ultimate.js`

### Step 2: Find the CONFIG Section

At the very top of the code, you'll find the CONFIG object. Look for the BUSINESS section:

```javascript
BUSINESS: {
  "default": {
    name: "Your Business Name",
    email: "your-email@example.com",
    phone: "+1 (555) 000-0000",
    website: "https://yourwebsite.com",
    address: "123 Business Street, City, State 12345",
    ...
  }
}
```

### Step 3: Update Each Field

Edit the following information with your actual company details:

**Basic Information:**
```javascript
name: "ABC Corporation",          // Your company name
email: "contact@abccorp.com",     // Contact email
phone: "+1 (555) 123-4567",       // Contact phone
website: "https://abccorp.com",   // Your website
address: "456 Oak Avenue, Denver, CO 80202"  // Your address
```

**Colors (used in email headers):**
```javascript
colors: {
  primary: "#0066cc",    // Main color (headers, buttons)
  accent: "#ff6600"      // Accent color (highlights)
}
```

---

## Social Media Configuration

Add your social media links to the footer. **Leave empty to hide that icon.**

```javascript
social: {
  facebook: "https://facebook.com/abccorp",
  twitter: "https://twitter.com/abccorp",
  instagram: "https://instagram.com/abccorp",
  linkedin: "https://linkedin.com/company/abccorp",
  youtube: "https://youtube.com/@abccorp"
}
```

### Example:
```javascript
social: {
  facebook: "https://facebook.com/mycompany",
  twitter: "https://twitter.com/mycompany",
  instagram: "",  // ← Leave empty to hide Instagram
  linkedin: "https://linkedin.com/company/mycompany",
  youtube: ""     // ← Leave empty to hide YouTube
}
```

**Result:** Email footer shows only Facebook, Twitter, and LinkedIn icons.

---

## App Store Links

Add links to your mobile app. **Leave empty if you don't have an app.**

```javascript
apps: {
  iosApp: "https://apps.apple.com/app/mycompany",
  androidApp: "https://play.google.com/store/apps/details?id=com.mycompany"
}
```

### Examples:

**Both apps available:**
```javascript
apps: {
  iosApp: "https://apps.apple.com/us/app/my-app/id1234567890",
  androidApp: "https://play.google.com/store/apps/details?id=com.mycompany.app"
}
```
**Result:** "Download Our App" section shows iOS and Android buttons.

**Only iOS app:**
```javascript
apps: {
  iosApp: "https://apps.apple.com/us/app/my-app/id1234567890",
  androidApp: ""  // ← Empty
}
```
**Result:** Only iOS button appears.

**No app:**
```javascript
apps: {
  iosApp: "",
  androidApp: ""
}
```
**Result:** "Download Our App" section is completely hidden.

---

## Email Footer Contents

Here's what appears in every email footer:

### 1. **Social Media Icons** (if configured)
- Facebook, Twitter, Instagram, LinkedIn, YouTube
- Clickable links to your social profiles
- Hidden if no social links are configured

### 2. **Company Information**
- Business name
- Address (if provided)
- Email and phone number
- Link to website

### 3. **App Download Links** (if configured)
- iOS App Store badge
- Google Play Store badge
- Hidden if no app URLs are configured

### 4. **Footer Links**
- Privacy Policy (links to {website}/privacy)
- Unsubscribe (links to {website}/unsubscribe)
- Preferences (links to {website}/preferences)

### 5. **Copyright**
- "© 2026 Your Company Name. All rights reserved."
- Year auto-updates automatically

---

## Color Customization

The footer uses your **primary color** from the CONFIG.

### Color Examples:

**Blue (Professional/Corporate):**
```javascript
colors: {
  primary: "#0066cc",     // Professional blue
  accent: "#ff6600"       // Warm accent
}
```

**Green (Environmental/Health):**
```javascript
colors: {
  primary: "#00AA00",     // Forest green
  accent: "#FFB81C"       // Warm gold
}
```

**Red (Urgent/Action):**
```javascript
colors: {
  primary: "#CC0000",     // Bold red
  accent: "#0066cc"       // Blue accent
}
```

**Purple (Creative):**
```javascript
colors: {
  primary: "#9900FF",     // Purple
  accent: "#00D4FF"       // Cyan accent
}
```

To find your brand colors, use: https://htmlcolorcodes.com

---

## How Footer Appears in Email

### Example Email with Footer:

```
┌─────────────────────────────────┐
│    COMPANY NAME (Header)         │  ← Your primary color
│    Some Email Content Here       │
│                                   │
│ [Action Button]                  │
│                                   │
├─────────────────────────────────┤  ← Footer starts here
│                                   │
│ f 𝕏 📷 in ▶️                      │  ← Social icons
│                                   │
│ ─────────────────────────────    │
│ ABC Corporation                   │
│ 456 Oak Avenue, Denver, CO        │
│ contact@abccorp.com | (555) 1234  │
│ Visit our website                 │
│ ─────────────────────────────    │
│                                   │
│ Download Our App                  │
│ [📱 iOS] [🤖 Android]             │  ← App links
│                                   │
│ Privacy Policy | Unsubscribe      │  ← Footer links
│                                   │
│ © 2026 ABC Corporation.           │
│    All rights reserved.           │
└─────────────────────────────────┘
```

---

## Complete Configuration Example

Here's a complete, ready-to-use configuration:

```javascript
BUSINESS: {
  "default": {
    name: "TechFlow Solutions",
    email: "hello@techflow.com",
    phone: "+1 (303) 555-0123",
    website: "https://techflow.com",
    address: "123 Tech Boulevard, Denver, CO 80202",
    colors: {
      primary: "#0066cc",
      accent: "#ff6600"
    },
    social: {
      facebook: "https://facebook.com/techflowsolutions",
      twitter: "https://twitter.com/techflow_co",
      instagram: "https://instagram.com/techflowsolutions",
      linkedin: "https://linkedin.com/company/techflow-solutions",
      youtube: "https://youtube.com/@TechFlowSolutions"
    },
    apps: {
      iosApp: "https://apps.apple.com/us/app/techflow/id1234567890",
      androidApp: "https://play.google.com/store/apps/details?id=com.techflow.app"
    }
  }
}
```

---

## Saving Your Configuration

After updating the CONFIG section:

1. **Save the script:** Ctrl+S (Windows) or Cmd+S (Mac)
2. **Refresh your Google Sheet:** F5
3. **Test an email:** Open "📧 Email Automation → ✉️ Compose & Send"
4. **Send a test email** to yourself to verify the footer looks correct

---

## Multiple Businesses (Advanced)

You can configure multiple businesses if needed:

```javascript
BUSINESS: {
  "default": {
    name: "Company A",
    email: "contact@companya.com",
    // ... rest of config
  },
  "company-b": {
    name: "Company B",
    email: "contact@companyb.com",
    // ... rest of config
  }
}
```

Then when composing emails, select "company-b" from the Business dropdown.

---

## Troubleshooting

### Footer Doesn't Appear
- Make sure you saved the script (Ctrl+S)
- Refresh the Google Sheet (F5)
- Send a new test email

### Social Icons Are Missing
- Check that the links start with `https://`
- URLs should not have trailing spaces
- Make sure the social media accounts exist

### App Links Don't Work
- Verify the App Store URLs are correct
- Test by clicking the link in the email
- Check in the email's HTML that the URL isn't truncated

### Footer Not Showing in Emails
- The footer is only added to emails sent with the new version
- Check the Email Log to see if emails show the footer
- Try sending a test email with the "Test System" feature

### Colors Look Different in Email
- Different email clients render colors slightly differently
- Gmail and Outlook render colors correctly
- Use standard hex color codes (like `#0066cc` not `rgb(0, 102, 204)`)

---

## Best Practices

✅ **DO:**
- Use your actual company email and phone number
- Include your physical address for professional credibility
- Add at least 2-3 social media accounts
- Keep URLs simple and avoid special characters
- Test the footer by sending to yourself first

❌ **DON'T:**
- Use placeholder information in production
- Mix different website domains in social links
- Leave all social fields empty (footer will look bare)
- Use invalid URLs (check they work in browser)
- Update CONFIG without saving and refreshing

---

## Template Footer Appearance

Every email template includes the same footer:

- **General Update** ✅
- **Video Update** ✅
- **Announcement** ✅
- **Newsletter** ✅
- **Form/Survey Request** ✅
- **Payment Reminder (Friendly)** ✅
- **Payment Reminder (Urgent)** ✅
- **Payment Reminder (Final)** ✅

The footer automatically adapts to show only the information you've configured.

---

## Getting Your Links

### Social Media:
- **Facebook:** https://facebook.com/yourpage (copy URL from address bar)
- **Twitter/X:** https://twitter.com/yourhandle
- **Instagram:** https://instagram.com/youraccount
- **LinkedIn:** https://linkedin.com/company/yourcompany
- **YouTube:** https://youtube.com/@yourchannel

### App Stores:
- **iOS:** Find your app on App Store, copy link (right-click "Share")
- **Android:** Find your app on Play Store, the link is in the address bar

---

## Color Inspiration

**Find brand colors:**
1. Screenshot your company logo
2. Go to https://htmlcolorcodes.com
3. Upload your screenshot
4. Copy the hex color code (e.g., `#0066cc`)

**Or use standard business colors:**
- Corporate Blue: `#0066cc`
- Professional Green: `#006622`
- Business Red: `#CC0000`
- Modern Purple: `#7733DD`

---

That's it! Your email footer is now fully customized with all your company information. 🎉
