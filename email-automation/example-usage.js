const EmailAutomation = require('./emailAutomation');

async function exampleSendQuoteEmail() {
  const emailAutomation = new EmailAutomation('./config.json');

  const result = await emailAutomation.sendEmail({
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

  console.log('Result:', result);
}

async function exampleSendFollowUp() {
  const emailAutomation = new EmailAutomation('./config.json');

  const result = await emailAutomation.sendEmail({
    to: 'customer@example.com',
    templateName: 'follow-up',
    businessKey: 'acme-corp',
    subject: 'Following Up on Your Quote - ACME Corp',
    data: {
      firstName: 'John',
      quoteId: 'Q-20260527001',
      calendarLink: 'https://calendly.com/acme/sales'
    }
  });

  console.log('Result:', result);
}

async function exampleSendSpecialOffer() {
  const emailAutomation = new EmailAutomation('./config.json');

  const result = await emailAutomation.sendEmail({
    to: 'customer@example.com',
    templateName: 'special-offer',
    businessKey: 'acme-corp',
    subject: '🎉 Special Offer Just for You - ACME Corp',
    data: {
      firstName: 'John',
      offerTitle: '30% Off Premium Services',
      offerDescription: 'Get 30% discount on all premium services when you sign up this week!',
      offerExpiry: 'June 3, 2026',
      offerLink: 'https://example.com/offers/premium-30'
    }
  });

  console.log('Result:', result);
}

async function exampleBatchEmails() {
  const emailAutomation = new EmailAutomation('./config.json');

  const recipients = [
    {
      email: 'john@example.com',
      firstName: 'John',
      quoteId: 'Q-20260527001',
      quoteDate: 'May 27, 2026'
    },
    {
      email: 'jane@example.com',
      firstName: 'Jane',
      quoteId: 'Q-20260527002',
      quoteDate: 'May 27, 2026'
    },
    {
      email: 'bob@example.com',
      firstName: 'Bob',
      quoteId: 'Q-20260527003',
      quoteDate: 'May 27, 2026'
    }
  ];

  const results = await emailAutomation.sendBatch(
    recipients,
    'quote-sent',
    'acme-corp',
    'Your Quote from ACME Corporation'
  );

  console.log('Batch Results:', results);
}

async function main() {
  try {
    console.log('=== Single Email Example (Quote Sent) ===');
    await exampleSendQuoteEmail();

    console.log('\n=== Single Email Example (Follow-up) ===');
    await exampleSendFollowUp();

    console.log('\n=== Single Email Example (Special Offer) ===');
    await exampleSendSpecialOffer();

    console.log('\n=== Batch Emails Example ===');
    await exampleBatchEmails();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  exampleSendQuoteEmail,
  exampleSendFollowUp,
  exampleSendSpecialOffer,
  exampleBatchEmails
};
