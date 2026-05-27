# Email Automation with Personalization

A configurable email automation system that sends personalized emails with multiple templates and business-specific styling.

## Features

✨ **Multiple Email Templates**
- Quote Sent
- Follow-up
- Special Offers
- Easily extensible for custom templates

🎨 **Business-Specific Customization**
- Per-business configurations
- Custom colors, logos, and branding
- Business contact information
- Custom signatures

👤 **Personalization**
- Name-based greeting
- Recipient-specific data
- Template variable interpolation
- Conditional template sections

⚙️ **Multiple Email Providers**
- Gmail API
- SMTP (any provider)
- Easy to extend

📧 **Batch Sending**
- Send emails to multiple recipients
- Personalize each email individually
- Progress tracking

## Setup

### 1. Install Dependencies

```bash
npm install nodemailer
```

### 2. Configure Your Business

Copy `config.example.json` to `config.json` and customize:

```bash
cp config.example.json config.json
```

Edit `config.json`:
- Set your email provider (Gmail or SMTP)
- Add your business details
- Customize colors, logo, contact info
- Add more businesses as needed

### 3. Set Environment Variables

#### For Gmail:
```bash
export GMAIL_USER="your-email@gmail.com"
export GMAIL_PASSWORD="your-app-password"  # Use App Password, not regular password
```

#### For SMTP:
```bash
export SMTP_HOST="smtp.example.com"
export SMTP_PORT="587"
export SMTP_USER="your-email@example.com"
export SMTP_PASSWORD="your-password"
export SMTP_SECURE="false"  # Set to true for port 465
```

## Usage

### Single Email

```javascript
const EmailAutomation = require('./emailAutomation');

const emailAutomation = new EmailAutomation('./config.json');

await emailAutomation.sendEmail({
  to: 'customer@example.com',
  templateName: 'quote-sent',
  businessKey: 'acme-corp',
  subject: 'Your Quote from ACME Corporation',
  data: {
    firstName: 'John',
    quoteId: 'Q-20260527001',
    quoteDate: 'May 27, 2026',
    totalAmount: '5,250.00',
    quoteLink: 'https://example.com/quotes/Q-20260527001'
  }
});
```

### Batch Emails

```javascript
const recipients = [
  {
    email: 'john@example.com',
    firstName: 'John',
    quoteId: 'Q-20260527001'
  },
  {
    email: 'jane@example.com',
    firstName: 'Jane',
    quoteId: 'Q-20260527002'
  }
];

const results = await emailAutomation.sendBatch(
  recipients,
  'quote-sent',
  'acme-corp',
  'Your Quote from ACME Corporation'
);
```

## Creating Custom Templates

Templates use simple variable substitution and conditional sections.

### Variables
- `{{variableName}}` - Will be replaced with data.variableName
- `{{businessName}}`, `{{businessEmail}}`, etc. - Auto-filled from business config

### Conditionals
```html
{{#if variableName}}
  <p>This shows only if variableName is truthy</p>
{{/if}}
```

### Example Template File

Create `templates/your-template.html`:

```html
<html>
  <body>
    <div class="container">
      <h1>Hello {{firstName}}!</h1>
      {{#if customMessage}}
        <p>{{customMessage}}</p>
      {{/if}}
      <p>Contact us: {{businessEmail}}</p>
    </div>
  </body>
</html>
```

Then use it:

```javascript
await emailAutomation.sendEmail({
  to: 'customer@example.com',
  templateName: 'your-template',
  businessKey: 'acme-corp',
  subject: 'Hello!',
  data: {
    firstName: 'John',
    customMessage: 'This is a custom message'
  }
});
```

## Configuration File Structure

```json
{
  "emailService": {
    "provider": "gmail|smtp",
    "senderEmail": "your-email@example.com",
    "senderName": "Your Business Name"
  },
  "businesses": {
    "business-key": {
      "name": "Business Display Name",
      "logo": "https://...",
      "colors": {
        "primary": "#0066cc",
        "accent": "#ff6600"
      },
      "contact": {
        "email": "info@business.com",
        "phone": "+1 (555) 000-0000",
        "website": "https://business.com"
      },
      "signature": "Best regards,\nThe Team"
    }
  }
}
```

## Available Business Data

The following variables are automatically available in all templates:
- `{{businessName}}`
- `{{businessLogo}}`
- `{{businessEmail}}`
- `{{businessPhone}}`
- `{{businessWebsite}}`
- `{{businessSignature}}`
- `{{primaryColor}}`
- `{{accentColor}}`

## API Reference

### `new EmailAutomation(configPath)`
Initializes the email automation system.

- `configPath` - Path to config.json (default: './config.json')

### `sendEmail(options)`
Sends a single email.

**Options:**
- `to` (string) - Recipient email address
- `templateName` (string) - Name of template file (without .html)
- `businessKey` (string) - Business configuration key (default: 'default')
- `subject` (string) - Email subject
- `data` (object) - Variables to interpolate in template

**Returns:** Promise resolving to `{success, messageId}` or `{success, error}`

### `sendBatch(recipients, templateName, businessKey, subject)`
Sends emails to multiple recipients.

**Parameters:**
- `recipients` (array) - Array of recipient objects with `email` and other data fields
- `templateName` (string) - Template to use
- `businessKey` (string) - Business configuration key
- `subject` (string) - Email subject

**Returns:** Promise resolving to array of results

### `loadTemplate(templateName)`
Loads a template file.

### `getBusiness(businessKey)`
Gets business configuration.

## Examples

Run the example file:
```bash
node example-usage.js
```

## Troubleshooting

### "Failed to load config from ./config.json"
- Make sure you've copied `config.example.json` to `config.json`
- Check the file path is correct

### "Gmail authentication failed"
- Use App Password instead of regular Gmail password
- Enable "Less secure app access" or use OAuth2
- Verify GMAIL_USER and GMAIL_PASSWORD environment variables

### "SMTP connection failed"
- Verify SMTP credentials
- Check SMTP_HOST and SMTP_PORT
- Ensure SMTP_SECURE is set correctly (true for 465, false for 587)

### "Template not found"
- Check template file exists in `templates/` directory
- Verify filename matches exactly
- Template files should have `.html` extension

## Security Notes

⚠️ Never commit `config.json` with real credentials
- Use environment variables for sensitive data
- Keep `.gitignore` updated with config files containing secrets

## Adding More Businesses

Simply add to the `businesses` object in `config.json`:

```json
{
  "businesses": {
    "existing-business": { ... },
    "new-business": {
      "name": "New Business Inc",
      "logo": "https://...",
      ...
    }
  }
}
```

Then use it:
```javascript
await emailAutomation.sendEmail({
  to: 'customer@example.com',
  templateName: 'quote-sent',
  businessKey: 'new-business',  // Use the new key
  ...
});
```
