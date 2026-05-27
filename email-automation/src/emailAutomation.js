const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

class EmailAutomation {
  constructor(configPath = './config.json') {
    this.config = this.loadConfig(configPath);
    this.transporter = this.initializeTransporter();
    this.templates = {};
  }

  loadConfig(configPath) {
    try {
      const data = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      throw new Error(`Failed to load config from ${configPath}: ${error.message}`);
    }
  }

  initializeTransporter() {
    const { provider, senderEmail } = this.config.emailService;

    if (provider === 'gmail') {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER || senderEmail,
          pass: process.env.GMAIL_PASSWORD
        }
      });
    } else if (provider === 'smtp') {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      });
    }
    throw new Error(`Unknown email provider: ${provider}`);
  }

  loadTemplate(templateName) {
    if (this.templates[templateName]) {
      return this.templates[templateName];
    }

    const templatePath = path.join(__dirname, 'templates', `${templateName}.html`);
    try {
      const template = fs.readFileSync(templatePath, 'utf8');
      this.templates[templateName] = template;
      return template;
    } catch (error) {
      throw new Error(`Failed to load template ${templateName}: ${error.message}`);
    }
  }

  renderTemplate(template, data) {
    let rendered = template;

    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, data[key] || '');
    });

    rendered = rendered.replace(/{{#if (\w+)}}(.*?){{\/if}}/gs, (match, key, content) => {
      return data[key] ? content : '';
    });

    return rendered;
  }

  getBusiness(businessKey) {
    const business = this.config.businesses[businessKey];
    if (!business) {
      throw new Error(`Business configuration not found: ${businessKey}`);
    }
    return business;
  }

  async sendEmail(options) {
    const {
      to,
      templateName,
      businessKey = 'default',
      subject,
      data = {}
    } = options;

    const business = this.getBusiness(businessKey);
    const template = this.loadTemplate(templateName);

    const emailData = {
      ...data,
      businessName: business.name,
      businessLogo: business.logo,
      businessEmail: business.contact.email,
      businessPhone: business.contact.phone,
      businessWebsite: business.contact.website,
      businessSignature: business.signature,
      primaryColor: business.colors.primary,
      accentColor: business.colors.accent
    };

    const htmlContent = this.renderTemplate(template, emailData);

    const mailOptions = {
      from: `${this.config.emailService.senderName} <${this.config.emailService.senderEmail}>`,
      to,
      subject,
      html: htmlContent
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${to}. Message ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`Failed to send email to ${to}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async sendBatch(recipients, templateName, businessKey = 'default', subject) {
    const results = [];

    for (const recipient of recipients) {
      const result = await this.sendEmail({
        to: recipient.email,
        templateName,
        businessKey,
        subject,
        data: recipient
      });
      results.push({ email: recipient.email, ...result });
    }

    return results;
  }
}

module.exports = EmailAutomation;
