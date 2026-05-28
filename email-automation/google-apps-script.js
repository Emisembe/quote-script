// ===== EMAIL AUTOMATION FOR GOOGLE APPS SCRIPT =====
// This is the main email sending system for Google Sheets

class BusinessEmailAutomation {
  constructor() {
    // This is where you put your business information
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
      },
      "acme-corp": {
        name: "ACME Corporation",
        email: "sales@acme.com",
        phone: "+1 (555) 123-4567",
        website: "https://acme.com",
        colors: {
          primary: "#1a1a1a",
          accent: "#ff0000"
        }
      }
    };

    // This is where your email templates live
    this.templates = {
      "quote-sent": this.getQuoteSentTemplate(),
      "follow-up": this.getFollowUpTemplate(),
      "special-offer": this.getSpecialOfferTemplate()
    };
  }

  // ===== EMAIL TEMPLATES =====
  // These are the designs of your emails

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

              <p style="color: #666; line-height: 1.6;">
                Thank you for reaching out to {{businessName}}!
                We're excited to provide you with a quote tailored to your needs.
              </p>

              <div style="background-color: #f5f5f5; border-left: 4px solid {{accentColor}}; padding: 15px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Quote ID:</strong> {{quoteId}}</p>
                <p style="margin: 5px 0;"><strong>Date:</strong> {{quoteDate}}</p>
                <p style="margin: 5px 0;"><strong>Total Amount:</strong> ${{totalAmount}}</p>
              </div>

              <p style="color: #666; line-height: 1.6;">
                Please review the attached quote. If you have any questions, feel free to reach out to us.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="{{quoteLink}}" style="background-color: {{primaryColor}}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Full Quote</a>
              </div>
            </div>
            <div style="background-color: #f9f9f9; padding: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; text-align: center;">
              <p style="margin: 5px 0;">{{businessName}}</p>
              <p style="margin: 5px 0;">📧 {{businessEmail}}</p>
              <p style="margin: 5px 0;">📞 {{businessPhone}}</p>
              <p style="margin: 5px 0;">🌐 {{businessWebsite}}</p>
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
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="background-color: {{primaryColor}}; color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0;">{{businessName}}</h1>
              <p style="margin: 10px 0 0 0; font-size: 14px;">Following Up on Your Quote</p>
            </div>
            <div style="padding: 30px;">
              <p style="font-size: 18px; font-weight: bold; color: #333;">Hi {{firstName}},</p>

              <p style="color: #666; line-height: 1.6;">
                I hope this message finds you well! I wanted to follow up on the quote <strong>{{quoteId}}</strong> we shared with you.
              </p>

              <p style="color: #666; line-height: 1.6;">
                If you have any questions about the proposal or would like to discuss modifications, I'm here to help!
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="{{calendarLink}}" style="background-color: {{primaryColor}}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Schedule a Call</a>
              </div>

              <p style="color: #666; line-height: 1.6;">
                Looking forward to working with you!
              </p>
            </div>
            <div style="background-color: #f9f9f9; padding: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; text-align: center;">
              <p style="margin: 5px 0;">{{businessName}}</p>
              <p style="margin: 5px 0;">📧 {{businessEmail}}</p>
              <p style="margin: 5px 0;">📞 {{businessPhone}}</p>
              <p style="margin: 5px 0;">🌐 {{businessWebsite}}</p>
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
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, {{primaryColor}}, {{accentColor}}); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 32px;">🎉</h1>
              <h2 style="margin: 10px 0; font-size: 24px;">LIMITED TIME OFFER</h2>
              <p style="margin: 0; font-size: 14px;">{{businessName}}</p>
            </div>
            <div style="padding: 30px;">
              <p style="font-size: 18px; font-weight: bold; color: #333;">Hi {{firstName}},</p>

              <p style="color: #666; line-height: 1.6;">
                We have an exclusive offer just for you!
              </p>

              <div style="background-color: #fff3cd; border: 2px solid {{accentColor}}; border-radius: 5px; padding: 20px; margin: 20px 0; text-align: center;">
                <p style="font-size: 24px; font-weight: bold; color: {{primaryColor}}; margin: 10px 0;">{{offerTitle}}</p>
                <p style="font-size: 14px; color: #666; margin: 10px 0;">{{offerDescription}}</p>
                <p style="font-size: 12px; color: #666; margin: 10px 0;"><strong>Valid until:</strong> {{offerExpiry}}</p>
              </div>

              <p style="color: #666; line-height: 1.6;">
                This is a limited-time opportunity. Don't miss out!
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="{{offerLink}}" style="background-color: {{primaryColor}}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Claim Your Offer</a>
              </div>
            </div>
            <div style="background-color: #f9f9f9; padding: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; text-align: center;">
              <p style="margin: 5px 0;">{{businessName}}</p>
              <p style="margin: 5px 0;">📧 {{businessEmail}}</p>
              <p style="margin: 5px 0;">📞 {{businessPhone}}</p>
              <p style="margin: 5px 0;">🌐 {{businessWebsite}}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  // ===== MAIN FUNCTION: SEND EMAIL =====
  // This is what you call to send an email

  sendEmail(recipientEmail, templateName, businessKey, emailSubject, data) {
    try {
      // Check if business exists
      if (!this.businesses[businessKey]) {
        throw new Error(`Business "${businessKey}" not found`);
      }

      // Check if template exists
      if (!this.templates[templateName]) {
        throw new Error(`Template "${templateName}" not found`);
      }

      // Get the business and template
      const business = this.businesses[businessKey];
      const template = this.templates[templateName];

      // Prepare all the data to put into the email
      const emailData = {
        ...data,
        businessName: business.name,
        businessEmail: business.email,
        businessPhone: business.phone,
        businessWebsite: business.website,
        primaryColor: business.colors.primary,
        accentColor: business.colors.accent
      };

      // Replace all {{variables}} with actual data
      let htmlContent = template;
      Object.keys(emailData).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        htmlContent = htmlContent.replace(regex, emailData[key] || '');
      });

      // Send the email
      GmailApp.sendEmail(recipientEmail, emailSubject, '', {
        htmlBody: htmlContent
      });

      return {
        success: true,
        message: `Email sent to ${recipientEmail}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ===== ADD A NEW TEMPLATE =====
  // Call this to add a new email template

  addTemplate(templateName, htmlContent) {
    this.templates[templateName] = htmlContent;
    return {
      success: true,
      message: `Template "${templateName}" added successfully`
    };
  }

  // ===== ADD A NEW BUSINESS =====
  // Call this to add a new business configuration

  addBusiness(businessKey, businessData) {
    this.businesses[businessKey] = businessData;
    return {
      success: true,
      message: `Business "${businessKey}" added successfully`
    };
  }

  // ===== GET LIST OF TEMPLATES =====
  getTemplateList() {
    return Object.keys(this.templates);
  }

  // ===== GET LIST OF BUSINESSES =====
  getBusinessList() {
    return Object.keys(this.businesses);
  }
}
