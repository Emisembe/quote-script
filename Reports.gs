// Report Generation Functions
// Creates comprehensive reports for management and analysis

// Generate payment report
function generatePaymentReport() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.CONTRIBUTIONS);
    const data = sheet.getDataRange().getValues();

    let paidMembers = [];
    let unpaidMembers = [];
    let partialMembers = [];
    let totalDue = 0;
    let totalPaid = 0;

    for (let i = 1; i < data.length; i++) {
      const member = {
        memberId: data[i][CONFIG.COLUMNS.CONTRIBUTIONS.MEMBER_ID],
        memberName: data[i][CONFIG.COLUMNS.CONTRIBUTIONS.MEMBER_NAME],
        amountDue: parseFloat(data[i][CONFIG.COLUMNS.CONTRIBUTIONS.AMOUNT_DUE]) || 0,
        amountPaid: parseFloat(data[i][CONFIG.COLUMNS.CONTRIBUTIONS.AMOUNT_PAID]) || 0,
        balance: parseFloat(data[i][CONFIG.COLUMNS.CONTRIBUTIONS.BALANCE]) || 0,
        status: data[i][CONFIG.COLUMNS.CONTRIBUTIONS.PAYMENT_STATUS],
        paymentDate: data[i][CONFIG.COLUMNS.CONTRIBUTIONS.PAYMENT_DATE],
        dueDate: data[i][CONFIG.COLUMNS.CONTRIBUTIONS.DUE_DATE]
      };

      totalDue += member.amountDue;
      totalPaid += member.amountPaid;

      if (member.status === 'PAID') {
        paidMembers.push(member);
      } else if (member.status === 'UNPAID') {
        unpaidMembers.push(member);
      } else if (member.status === 'PARTIAL') {
        partialMembers.push(member);
      }
    }

    // Build HTML table
    let html = '<table style="width: 100%; border-collapse: collapse;">';

    // Paid members section
    if (paidMembers.length > 0) {
      html += '<tr><th colspan="5" style="background: #22c55e; color: white; padding: 12px; text-align: left;">✓ PAID MEMBERS (' + paidMembers.length + ')</th></tr>';
      html += '<tr style="background: #dcfce7;"><th style="border: 1px solid #ddd; padding: 10px;">Member ID</th><th style="border: 1px solid #ddd; padding: 10px;">Name</th><th style="border: 1px solid #ddd; padding: 10px;">Amount</th><th style="border: 1px solid #ddd; padding: 10px;">Payment Date</th><th style="border: 1px solid #ddd; padding: 10px;">Status</th></tr>';
      paidMembers.forEach(member => {
        html += `<tr style="background: #f0fdf4;">
          <td style="border: 1px solid #ddd; padding: 10px;">${escapeHtml(member.memberId)}</td>
          <td style="border: 1px solid #ddd; padding: 10px;">${escapeHtml(member.memberName)}</td>
          <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">${member.amountDue}</td>
          <td style="border: 1px solid #ddd; padding: 10px;">${formatDate(member.paymentDate)}</td>
          <td style="border: 1px solid #ddd; padding: 10px; color: #22c55e; font-weight: bold;">PAID</td>
        </tr>`;
      });
    }

    // Unpaid members section
    if (unpaidMembers.length > 0) {
      html += '<tr><th colspan="5" style="background: #ef4444; color: white; padding: 12px; text-align: left;">✗ UNPAID MEMBERS (' + unpaidMembers.length + ')</th></tr>';
      html += '<tr style="background: #fee2e2;"><th style="border: 1px solid #ddd; padding: 10px;">Member ID</th><th style="border: 1px solid #ddd; padding: 10px;">Name</th><th style="border: 1px solid #ddd; padding: 10px;">Amount Due</th><th style="border: 1px solid #ddd; padding: 10px;">Due Date</th><th style="border: 1px solid #ddd; padding: 10px;">Status</th></tr>';
      unpaidMembers.forEach(member => {
        html += `<tr style="background: #fef2f2;">
          <td style="border: 1px solid #ddd; padding: 10px;">${escapeHtml(member.memberId)}</td>
          <td style="border: 1px solid #ddd; padding: 10px;">${escapeHtml(member.memberName)}</td>
          <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">${member.amountDue}</td>
          <td style="border: 1px solid #ddd; padding: 10px;">${formatDate(member.dueDate)}</td>
          <td style="border: 1px solid #ddd; padding: 10px; color: #ef4444; font-weight: bold;">UNPAID</td>
        </tr>`;
      });
    }

    // Partial payments section
    if (partialMembers.length > 0) {
      html += '<tr><th colspan="5" style="background: #f59e0b; color: white; padding: 12px; text-align: left;">⚠ PARTIAL PAYMENTS (' + partialMembers.length + ')</th></tr>';
      html += '<tr style="background: #fef3c7;"><th style="border: 1px solid #ddd; padding: 10px;">Member ID</th><th style="border: 1px solid #ddd; padding: 10px;">Name</th><th style="border: 1px solid #ddd; padding: 10px;">Balance</th><th style="border: 1px solid #ddd; padding: 10px;">Paid</th><th style="border: 1px solid #ddd; padding: 10px;">Status</th></tr>';
      partialMembers.forEach(member => {
        html += `<tr style="background: #fffbeb;">
          <td style="border: 1px solid #ddd; padding: 10px;">${escapeHtml(member.memberId)}</td>
          <td style="border: 1px solid #ddd; padding: 10px;">${escapeHtml(member.memberName)}</td>
          <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">${member.balance}</td>
          <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">${member.amountPaid}</td>
          <td style="border: 1px solid #ddd; padding: 10px; color: #f59e0b; font-weight: bold;">PARTIAL</td>
        </tr>`;
      });
    }

    html += '</table>';

    return {
      html: html,
      totalMembers: data.length - 1,
      paidCount: paidMembers.length,
      unpaidCount: unpaidMembers.length,
      partialCount: partialMembers.length,
      totalDue: totalDue,
      totalPaid: totalPaid,
      totalOutstanding: (totalDue - totalPaid)
    };
  } catch (error) {
    console.log('Error generating payment report: ' + error.toString());
    return { html: '<p>Error generating report</p>', totalMembers: 0, paidCount: 0, unpaidCount: 0, partialCount: 0, totalDue: 0, totalPaid: 0, totalOutstanding: 0 };
  }
}

// Generate member list report
function generateMemberListReport() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.MEMBERS);
    const data = sheet.getDataRange().getValues();

    let html = '<table style="width: 100%; border-collapse: collapse;">';
    html += '<tr style="background: #4285F4; color: white;"><th style="border: 1px solid #ddd; padding: 10px;">Member ID</th><th style="border: 1px solid #ddd; padding: 10px;">Name</th><th style="border: 1px solid #ddd; padding: 10px;">Phone</th><th style="border: 1px solid #ddd; padding: 10px;">Email</th><th style="border: 1px solid #ddd; padding: 10px;">Status</th><th style="border: 1px solid #ddd; padding: 10px;">Join Date</th><th style="border: 1px solid #ddd; padding: 10px;">Group</th></tr>';

    for (let i = 1; i < data.length; i++) {
      const status = data[i][CONFIG.COLUMNS.MEMBERS.STATUS];
      const statusColor = status === 'ACTIVE' ? '#22c55e' : '#ef4444';

      html += `<tr style="background: ${i % 2 === 0 ? '#f9f9f9' : 'white'};">
        <td style="border: 1px solid #ddd; padding: 10px;">${escapeHtml(data[i][CONFIG.COLUMNS.MEMBERS.MEMBER_ID])}</td>
        <td style="border: 1px solid #ddd; padding: 10px;">${escapeHtml(data[i][CONFIG.COLUMNS.MEMBERS.FULL_NAME])}</td>
        <td style="border: 1px solid #ddd; padding: 10px;">${escapeHtml(data[i][CONFIG.COLUMNS.MEMBERS.PHONE])}</td>
        <td style="border: 1px solid #ddd; padding: 10px;">${escapeHtml(data[i][CONFIG.COLUMNS.MEMBERS.EMAIL])}</td>
        <td style="border: 1px solid #ddd; padding: 10px; color: ${statusColor}; font-weight: bold;">${escapeHtml(status)}</td>
        <td style="border: 1px solid #ddd; padding: 10px;">${formatDate(data[i][CONFIG.COLUMNS.MEMBERS.JOIN_DATE])}</td>
        <td style="border: 1px solid #ddd; padding: 10px;">${escapeHtml(data[i][CONFIG.COLUMNS.MEMBERS.GROUP])}</td>
      </tr>`;
    }

    html += '</table>';

    return {
      html: html,
      totalMembers: data.length - 1
    };
  } catch (error) {
    console.log('Error generating member report: ' + error.toString());
    return { html: '<p>Error generating report</p>', totalMembers: 0 };
  }
}

// Generate contribution summary report
function generateContributionSummary() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.CONTRIBUTIONS);
    const data = sheet.getDataRange().getValues();

    const typesSummary = {};
    let totalByType = {};
    let paidByType = {};

    for (let i = 1; i < data.length; i++) {
      const type = data[i][CONFIG.COLUMNS.CONTRIBUTIONS.CONTRIBUTION_TYPE];
      const amountDue = parseFloat(data[i][CONFIG.COLUMNS.CONTRIBUTIONS.AMOUNT_DUE]) || 0;
      const amountPaid = parseFloat(data[i][CONFIG.COLUMNS.CONTRIBUTIONS.AMOUNT_PAID]) || 0;

      if (!typesSummary[type]) {
        typesSummary[type] = { count: 0, totalDue: 0, totalPaid: 0 };
      }

      typesSummary[type].count++;
      typesSummary[type].totalDue += amountDue;
      typesSummary[type].totalPaid += amountPaid;
    }

    let html = '<table style="width: 100%; border-collapse: collapse;">';
    html += '<tr style="background: #4285F4; color: white;"><th style="border: 1px solid #ddd; padding: 10px;">Contribution Type</th><th style="border: 1px solid #ddd; padding: 10px;">Members</th><th style="border: 1px solid #ddd; padding: 10px;">Total Due</th><th style="border: 1px solid #ddd; padding: 10px;">Total Paid</th><th style="border: 1px solid #ddd; padding: 10px;">Outstanding</th></tr>';

    Object.keys(typesSummary).forEach((type, index) => {
      const summary = typesSummary[type];
      const outstanding = summary.totalDue - summary.totalPaid;

      html += `<tr style="background: ${index % 2 === 0 ? '#f9f9f9' : 'white'};">
        <td style="border: 1px solid #ddd; padding: 10px;">${escapeHtml(type)}</td>
        <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${summary.count}</td>
        <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">${summary.totalDue}</td>
        <td style="border: 1px solid #ddd; padding: 10px; text-align: right; color: #22c55e;">${summary.totalPaid}</td>
        <td style="border: 1px solid #ddd; padding: 10px; text-align: right; color: #ef4444;">${outstanding}</td>
      </tr>`;
    });

    html += '</table>';

    return {
      html: html,
      summary: typesSummary
    };
  } catch (error) {
    console.log('Error generating contribution summary: ' + error.toString());
    return { html: '<p>Error generating report</p>', summary: {} };
  }
}

// Export report to new sheet
function exportReportToSheet(reportType) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd_HHmmss');
    const sheetName = `Report_${reportType}_${timestamp}`;

    let report;
    let data = [];

    if (reportType === 'PAYMENT') {
      report = generatePaymentReport();
      // Extract data for payment report
      const contributionsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.CONTRIBUTIONS);
      const rawData = contributionsSheet.getDataRange().getValues();

      data.push(['Member ID', 'Member Name', 'Amount Due', 'Amount Paid', 'Balance', 'Status', 'Due Date', 'Payment Date']);
      for (let i = 1; i < rawData.length; i++) {
        data.push([
          rawData[i][CONFIG.COLUMNS.CONTRIBUTIONS.MEMBER_ID],
          rawData[i][CONFIG.COLUMNS.CONTRIBUTIONS.MEMBER_NAME],
          rawData[i][CONFIG.COLUMNS.CONTRIBUTIONS.AMOUNT_DUE],
          rawData[i][CONFIG.COLUMNS.CONTRIBUTIONS.AMOUNT_PAID],
          rawData[i][CONFIG.COLUMNS.CONTRIBUTIONS.BALANCE],
          rawData[i][CONFIG.COLUMNS.CONTRIBUTIONS.PAYMENT_STATUS],
          rawData[i][CONFIG.COLUMNS.CONTRIBUTIONS.DUE_DATE],
          rawData[i][CONFIG.COLUMNS.CONTRIBUTIONS.PAYMENT_DATE]
        ]);
      }
    } else if (reportType === 'MEMBERS') {
      report = generateMemberListReport();
      const membersSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.MEMBERS);
      const rawData = membersSheet.getDataRange().getValues();

      data = rawData; // Use raw data directly
    }

    if (data.length > 0) {
      const reportSheet = ss.insertSheet(sheetName);
      reportSheet.getRange(1, 1, data.length, data[0].length).setValues(data);

      logAction('Export Report', `${reportType} report exported to sheet: ${sheetName}`);
      return sheetName;
    }
  } catch (error) {
    logAction('Export Report Error', error.toString());
    return null;
  }
}

// Generate summary statistics
function generateSummaryStatistics() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const membersSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.MEMBERS);
    const contributionsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.CONTRIBUTIONS);

    const memberCount = membersSheet.getDataRange().getValues().length - 1;
    const paymentStats = calculatePaymentStats();

    const stats = {
      reportDate: new Date(),
      totalMembers: memberCount,
      activeMembers: membersSheet.getDataRange().getValues().filter((row, idx) => idx > 0 && row[CONFIG.COLUMNS.MEMBERS.STATUS] === 'ACTIVE').length,
      inactiveMembers: membersSheet.getDataRange().getValues().filter((row, idx) => idx > 0 && row[CONFIG.COLUMNS.MEMBERS.STATUS] !== 'ACTIVE').length,
      paymentStats: paymentStats
    };

    return stats;
  } catch (error) {
    console.log('Error generating statistics: ' + error.toString());
    return null;
  }
}

// Helper function
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
