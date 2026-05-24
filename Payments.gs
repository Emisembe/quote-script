// Payment Tracking and Management Functions
// Handles all payment-related operations

// Update payment record
function updatePaymentRecord(memberId, amountPaid, paymentDate, notes = '') {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.CONTRIBUTIONS);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][CONFIG.COLUMNS.CONTRIBUTIONS.MEMBER_ID] == memberId) {
        const amountDue = data[i][CONFIG.COLUMNS.CONTRIBUTIONS.AMOUNT_DUE];
        const totalPaid = (data[i][CONFIG.COLUMNS.CONTRIBUTIONS.AMOUNT_PAID] || 0) + amountPaid;
        const balance = amountDue - totalPaid;
        const paymentStatus = balance <= 0 ? 'PAID' : 'PARTIAL';

        const row = i + 1;
        sheet.getRange(row, CONFIG.COLUMNS.CONTRIBUTIONS.AMOUNT_PAID + 1).setValue(totalPaid);
        sheet.getRange(row, CONFIG.COLUMNS.CONTRIBUTIONS.PAYMENT_STATUS + 1).setValue(paymentStatus);
        sheet.getRange(row, CONFIG.COLUMNS.CONTRIBUTIONS.PAYMENT_DATE + 1).setValue(paymentDate || new Date());
        sheet.getRange(row, CONFIG.COLUMNS.CONTRIBUTIONS.BALANCE + 1).setValue(Math.max(0, balance));

        const memberName = data[i][CONFIG.COLUMNS.CONTRIBUTIONS.MEMBER_NAME];
        logAction('Payment Updated', `${memberName} (${memberId}) - Amount: ${amountPaid}, Status: ${paymentStatus}`);

        // Send confirmation email if fully paid
        if (paymentStatus === 'PAID') {
          sendPaymentConfirmationEmail(memberId);
        }

        return { success: true, status: paymentStatus, balance: Math.max(0, balance) };
      }
    }

    return { success: false, error: 'Member not found' };
  } catch (error) {
    logAction('Payment Update Error', error.toString());
    return { success: false, error: error.toString() };
  }
}

// Batch update payments from Payments sheet
function processBatchPayments() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const paymentsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PAYMENTS);

    if (!paymentsSheet) {
      logAction('Batch Payments', 'Payments sheet not found');
      return 0;
    }

    const data = paymentsSheet.getDataRange().getValues();
    let processedCount = 0;

    for (let i = 1; i < data.length; i++) {
      const memberId = data[i][0];
      const amountPaid = data[i][1];
      const paymentDate = data[i][2];
      const status = data[i][3]; // 'PROCESSED' or empty

      if (memberId && amountPaid && !status) {
        updatePaymentRecord(memberId, amountPaid, paymentDate);
        paymentsSheet.getRange(i + 1, 4).setValue('PROCESSED');
        paymentsSheet.getRange(i + 1, 5).setValue(new Date());
        processedCount++;
      }
    }

    logAction('Batch Payments', `Processed ${processedCount} payments`);
    return processedCount;
  } catch (error) {
    logAction('Batch Payments Error', error.toString());
    return 0;
  }
}

// Calculate payment statistics
function calculatePaymentStats() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.CONTRIBUTIONS);
    const data = sheet.getDataRange().getValues();

    let totalDue = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let paidCount = 0;
    let unpaidCount = 0;
    let partialCount = 0;

    for (let i = 1; i < data.length; i++) {
      const amountDue = parseFloat(data[i][CONFIG.COLUMNS.CONTRIBUTIONS.AMOUNT_DUE]) || 0;
      const amountPaid = parseFloat(data[i][CONFIG.COLUMNS.CONTRIBUTIONS.AMOUNT_PAID]) || 0;
      const status = data[i][CONFIG.COLUMNS.CONTRIBUTIONS.PAYMENT_STATUS];

      totalDue += amountDue;
      totalPaid += amountPaid;

      if (status === 'PAID') {
        paidCount++;
      } else if (status === 'UNPAID') {
        unpaidCount++;
        totalOutstanding += amountDue;
      } else if (status === 'PARTIAL') {
        partialCount++;
        totalOutstanding += (amountDue - amountPaid);
      }
    }

    return {
      totalDue: totalDue,
      totalPaid: totalPaid,
      totalOutstanding: totalOutstanding,
      paidCount: paidCount,
      unpaidCount: unpaidCount,
      partialCount: partialCount,
      totalMembers: data.length - 1,
      paidPercentage: data.length > 1 ? Math.round((paidCount / (data.length - 1)) * 100) : 0
    };
  } catch (error) {
    logAction('Payment Stats Error', error.toString());
    return null;
  }
}

// Get member payment history
function getMemberPaymentHistory(memberId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.CONTRIBUTIONS);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][CONFIG.COLUMNS.CONTRIBUTIONS.MEMBER_ID] == memberId) {
        return {
          memberId: data[i][CONFIG.COLUMNS.CONTRIBUTIONS.MEMBER_ID],
          memberName: data[i][CONFIG.COLUMNS.CONTRIBUTIONS.MEMBER_NAME],
          contributionType: data[i][CONFIG.COLUMNS.CONTRIBUTIONS.CONTRIBUTION_TYPE],
          amountDue: data[i][CONFIG.COLUMNS.CONTRIBUTIONS.AMOUNT_DUE],
          amountPaid: data[i][CONFIG.COLUMNS.CONTRIBUTIONS.AMOUNT_PAID],
          paymentStatus: data[i][CONFIG.COLUMNS.CONTRIBUTIONS.PAYMENT_STATUS],
          dueDate: data[i][CONFIG.COLUMNS.CONTRIBUTIONS.DUE_DATE],
          paymentDate: data[i][CONFIG.COLUMNS.CONTRIBUTIONS.PAYMENT_DATE],
          balance: data[i][CONFIG.COLUMNS.CONTRIBUTIONS.BALANCE]
        };
      }
    }
    return null;
  } catch (error) {
    console.log('Error getting payment history: ' + error.toString());
    return null;
  }
}

// Create payment reminder for overdue payments
function sendOverduePaymentReminders() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.CONTRIBUTIONS);
    const data = sheet.getDataRange().getValues();
    let remindersSent = 0;
    const today = new Date();

    for (let i = 1; i < data.length; i++) {
      const dueDate = new Date(data[i][CONFIG.COLUMNS.CONTRIBUTIONS.DUE_DATE]);
      const paymentStatus = data[i][CONFIG.COLUMNS.CONTRIBUTIONS.PAYMENT_STATUS];
      const memberId = data[i][CONFIG.COLUMNS.CONTRIBUTIONS.MEMBER_ID];

      // Send reminder if payment is overdue and unpaid
      if (dueDate < today && (paymentStatus === 'UNPAID' || paymentStatus === 'PARTIAL')) {
        const email = getMemberEmail(memberId);
        if (email) {
          const memberName = data[i][CONFIG.COLUMNS.CONTRIBUTIONS.MEMBER_NAME];
          const amountDue = data[i][CONFIG.COLUMNS.CONTRIBUTIONS.AMOUNT_DUE];
          const balance = data[i][CONFIG.COLUMNS.CONTRIBUTIONS.BALANCE];
          const senderInfo = getEmailSettings();

          sendOverdueReminderEmail(email, memberName, amountDue, dueDate, balance, senderInfo);
          remindersSent++;
        }
      }
    }

    logAction('Overdue Reminders', `Sent ${remindersSent} overdue payment reminders`);
    return remindersSent;
  } catch (error) {
    logAction('Overdue Reminders Error', error.toString());
    return 0;
  }
}

// Send overdue payment reminder email
function sendOverdueReminderEmail(memberEmail, memberName, amount, dueDate, balance, senderInfo) {
  const orgName = senderInfo.orgName || 'Our Community';
  const treasurerEmail = senderInfo.treasurerEmail || 'treasurer@community.org';
  const paymentInfo = senderInfo.paymentInfo || 'Bank details to be provided';

  const subject = `URGENT: Overdue Payment - ${orgName}`;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; color: white; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">⚠️ OVERDUE PAYMENT</h1>
        <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Action Required</p>
      </div>

      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef; border-top: none;">
        <p>Dear ${memberName},</p>

        <p style="color: #ef4444; font-weight: bold;">Your payment is now overdue. Please process payment immediately to maintain your membership.</p>

        <div style="background: #fee2e2; padding: 20px; border-left: 4px solid #ef4444; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Amount Due:</strong> ${amount}</p>
          <p style="margin: 5px 0;"><strong>Due Date:</strong> ${formatDate(dueDate)}</p>
          <p style="margin: 5px 0;"><strong>Outstanding Balance:</strong> ${balance}</p>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: #991b1b;"><strong>Status:</strong> OVERDUE</p>
        </div>

        <h3 style="color: #ef4444;">Payment Instructions:</h3>
        <p>${paymentInfo}</p>

        <p style="color: #666; font-weight: bold;">Please remit payment as soon as possible to avoid suspension of membership.</p>

        <h3 style="color: #333;">Have Questions?</h3>
        <p>Contact our treasurer:</p>
        <p>
          <strong>Email:</strong> <a href="mailto:${treasurerEmail}">${treasurerEmail}</a>
        </p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

        <p style="color: #666; font-size: 12px; margin: 0;">
          This is an automated message. Please do not reply to this email.<br>
          ${orgName}
        </p>
      </div>
    </div>
  `;

  try {
    GmailApp.sendEmail(memberEmail, subject, '', {
      htmlBody: htmlBody,
      noReply: true
    });
  } catch (error) {
    logAction('Overdue Email Error', `Failed to send to ${memberEmail}: ${error.toString()}`);
  }
}

// Set contribution amount for members
function setContributionAmount(amount) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.CONTRIBUTIONS);
    const data = sheet.getDataRange().getValues();
    let updatedCount = 0;

    for (let i = 1; i < data.length; i++) {
      const currentAmount = data[i][CONFIG.COLUMNS.CONTRIBUTIONS.AMOUNT_DUE];

      if (!currentAmount || currentAmount === 0) {
        const row = i + 1;
        sheet.getRange(row, CONFIG.COLUMNS.CONTRIBUTIONS.AMOUNT_DUE + 1).setValue(amount);
        sheet.getRange(row, CONFIG.COLUMNS.CONTRIBUTIONS.BALANCE + 1).setValue(amount);

        if (!data[i][CONFIG.COLUMNS.CONTRIBUTIONS.PAYMENT_STATUS]) {
          sheet.getRange(row, CONFIG.COLUMNS.CONTRIBUTIONS.PAYMENT_STATUS + 1).setValue('UNPAID');
        }

        updatedCount++;
      }
    }

    logAction('Set Contribution Amount', `Updated ${updatedCount} members with amount ${amount}`);
    return updatedCount;
  } catch (error) {
    logAction('Set Contribution Error', error.toString());
    return 0;
  }
}

// Create payment receipt
function generatePaymentReceipt(memberId) {
  try {
    const memberHistory = getMemberPaymentHistory(memberId);
    if (!memberHistory) {
      return null;
    }

    const receiptData = {
      receiptNumber: `REC-${memberId}-${new Date().getTime()}`,
      date: new Date(),
      memberName: memberHistory.memberName,
      memberId: memberId,
      amountPaid: memberHistory.amountPaid,
      paymentStatus: memberHistory.paymentStatus,
      balance: memberHistory.balance,
      contributionType: memberHistory.contributionType
    };

    // Log the receipt
    logAction('Generate Receipt', `Receipt generated for ${memberHistory.memberName}`);

    return receiptData;
  } catch (error) {
    logAction('Receipt Generation Error', error.toString());
    return null;
  }
}
