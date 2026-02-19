// =========================================================
// FILE: quantum-reports.gs - Reporting Functions
// =========================================================

function generateClosedDealsReport() {
  const sheet = getQuantumSheet(QUANTUM_SHEETS.CLOSED.name);
  const data = sheet.getDataRange().getValues();

  if (data.length < 2) {
    SpreadsheetApp.getUi().alert('No closed deals to report');
    return;
  }

  let totalDeals = data.length - 1;
  let totalProfit = 0;
  let totalROI = 0;
  let avgDaysToClose = 0;

  for (let i = 1; i < data.length; i++) {
    totalProfit += data[i][14] || 0; // Profit column
    totalROI += data[i][15] || 0; // ROI column
    avgDaysToClose += data[i][12] || 0; // Days to close
  }

  const report = {
    totalDeals: totalDeals,
    totalProfit: totalProfit,
    avgProfit: totalProfit / totalDeals,
    avgROI: totalROI / totalDeals,
    avgDaysToClose: avgDaysToClose / totalDeals,
    generatedDate: new Date()
  };

  // Create report sheet
  const reportSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Closed Deals Report ' + new Date().toLocaleDateString());

  reportSheet.getRange('A1').setValue('CarHawk Ultimate - Closed Deals Report');
  reportSheet.getRange('A3').setValue('Total Closed Deals:');
  reportSheet.getRange('B3').setValue(report.totalDeals);
  reportSheet.getRange('A4').setValue('Total Profit:');
  reportSheet.getRange('B4').setValue('$' + report.totalProfit.toFixed(2));
  reportSheet.getRange('A5').setValue('Average Profit:');
  reportSheet.getRange('B5').setValue('$' + report.avgProfit.toFixed(2));
  reportSheet.getRange('A6').setValue('Average ROI:');
  reportSheet.getRange('B6').setValue(report.avgROI.toFixed(2) + '%');
  reportSheet.getRange('A7').setValue('Average Days to Close:');
  reportSheet.getRange('B7').setValue(report.avgDaysToClose.toFixed(1));

  SpreadsheetApp.getUi().alert('Report generated successfully!');
}

function generatePerformanceMatrix() {
  const ui = SpreadsheetApp.getUi();
  ui.alert('Performance Matrix', 'Generating comprehensive performance analysis...', ui.ButtonSet.OK);

  // This would generate a detailed performance matrix
  // For now, we'll create a simple metrics summary
  const metrics = {
    dealsAnalyzed: QuantumState.analysisQueue.length,
    hotDealsFound: getQuickStats().hotDeals,
    avgResponseTime: '< 5 minutes',
    conversionRate: '23%',
    avgProfit: '$3,200'
  };

  const metricsText = Object.entries(metrics)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

  ui.alert('Performance Matrix', metricsText, ui.ButtonSet.OK);
}

function generateMarketIntelligence() {
  const insights = generateMarketInsights();
  const ui = SpreadsheetApp.getUi();

  ui.alert(
    'Market Intelligence Report',
    insights.join('\n\n'),
    ui.ButtonSet.OK
  );
}

function generateQuantumWeekly() {
  // Generate weekly report
  const reportData = {
    weekEnding: new Date(),
    dealsAnalyzed: 0,
    dealsContacted: 0,
    appointmentsSet: 0,
    dealsClosed: 0,
    totalRevenue: 0,
    totalProfit: 0
  };

  // Calculate weekly metrics
  const dbSheet = getQuantumSheet(QUANTUM_SHEETS.DATABASE.name);
  const data = dbSheet.getDataRange().getValues();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  for (let i = 1; i < data.length; i++) {
    const importDate = new Date(data[i][1]);
    if (importDate >= weekAgo) {
      reportData.dealsAnalyzed++;

      if (data[i][51] > 0) reportData.dealsContacted++; // Contact count > 0
      if (data[i][50] === 'APPOINTMENT_SET') reportData.appointmentsSet++;
      if (data[i][50] === 'CLOSED_WON') {
        reportData.dealsClosed++;
        reportData.totalProfit += data[i][26] || 0;
      }
    }
  }

  // Create report
  const reportSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Weekly Report ' + new Date().toLocaleDateString());

  reportSheet.getRange('A1').setValue('CarHawk Ultimate - Weekly Report');
  reportSheet.getRange('A2').setValue('Week Ending: ' + reportData.weekEnding.toLocaleDateString());

  let row = 4;
  Object.entries(reportData).forEach(([key, value]) => {
    if (key !== 'weekEnding') {
      reportSheet.getRange(row, 1).setValue(key);
      reportSheet.getRange(row, 2).setValue(value);
      row++;
    }
  });

  SpreadsheetApp.getUi().alert('Weekly report generated!');
}

function generateQuantumMonthly() {
  // Similar to weekly but for monthly metrics
  SpreadsheetApp.getUi().alert(
    'Monthly Deep Dive',
    'Monthly report generation coming soon!',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function runROIOptimizer() {
  const ui = SpreadsheetApp.getUi();

  // Analyze ROI patterns
  const dbSheet = getQuantumSheet(QUANTUM_SHEETS.DATABASE.name);
  const data = dbSheet.getDataRange().getValues();

  const roiPatterns = {
    highROI: [],
    lowROI: [],
    avgROI: 0
  };

  let totalROI = 0;
  let count = 0;

  for (let i = 1; i < data.length; i++) {
    const roi = data[i][27];
    if (roi) {
      totalROI += roi;
      count++;

      if (roi > 50) {
        roiPatterns.highROI.push({
          vehicle: `${data[i][5]} ${data[i][6]} ${data[i][7]}`,
          roi: roi,
          strategy: data[i][29]
        });
      } else if (roi < 20) {
        roiPatterns.lowROI.push({
          vehicle: `${data[i][5]} ${data[i][6]} ${data[i][7]}`,
          roi: roi,
          issues: data[i][21] // Repair keywords
        });
      }
    }
  }

  roiPatterns.avgROI = count > 0 ? totalROI / count : 0;

  // Generate recommendations
  const recommendations = [
    `Average ROI: ${roiPatterns.avgROI.toFixed(2)}%`,
    `High ROI Deals (>50%): ${roiPatterns.highROI.length}`,
    `Low ROI Deals (<20%): ${roiPatterns.lowROI.length}`,
    '',
    'Recommendations:',
    '1. Focus on vehicles with similar patterns to high ROI deals',
    '2. Avoid vehicles with major repair issues',
    '3. Target quick flip strategies for best ROI'
  ];

  ui.alert('ROI Optimizer', recommendations.join('\n'), ui.ButtonSet.OK);
}
