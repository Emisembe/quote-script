# Email Automation Module

A standalone, configurable email automation system with personalization and multiple templates. Can be used independently for any business.

## Directory Structure

```
email-automation/
├── emailAutomation.js       # Main module class
├── package.json             # Dependencies
├── README.md               # This file
├── EMAIL-AUTOMATION.md     # Full documentation
├── config/
│   └── config.example.json # Configuration template
├── templates/
│   ├── quote-sent.html
│   ├── follow-up.html
│   └── special-offer.html
└── examples/
    └── example-usage.js    # Usage examples
```

## Quick Start

1. **Copy config example:**
   ```bash
   cp config/config.example.json config.json
   ```

2. **Edit config.json** with your business details

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Set environment variables:**
   ```bash
   export GMAIL_USER="your-email@gmail.com"
   export GMAIL_PASSWORD="your-app-password"
   ```

5. **Use in your code:**
   ```javascript
   const EmailAutomation = require('./emailAutomation');
   
   const emailAutomation = new EmailAutomation('./config.json');
   
   await emailAutomation.sendEmail({
     to: 'customer@example.com',
     templateName: 'quote-sent',
     businessKey: 'acme-corp',
     subject: 'Your Quote',
     data: { firstName: 'John', quoteId: 'Q-001' }
   });
   ```

See **EMAIL-AUTOMATION.md** for complete documentation and examples.
