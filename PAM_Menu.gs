// =========================================================
// FILE: PAM_Menu.gs — PAM Menu Registration & Entry Points
// Project Arbitrage Module — Quantum Workbook Ecosystem
// NOTE: onOpen() lives in quantum_menu.gs — PAM menu is
//       added via addPAMMenu() called from createQuantumMenu()
// =========================================================

function addPAMMenu() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('⚡ PAM')
    .addItem('Open Command Center',      'openPAMDashboard')
    .addSeparator()
    .addItem('Run Logic Engine',         'runPAMLogicEngine')
    .addItem('Run AI Evaluation',        'runPAMAIEvaluation')
    .addItem('Full Cycle (Logic → AI)',  'runPAMFullCycle')
    .addSeparator()
    .addItem('Initialize PAM Sheets',    'initializePAMSheets')
    .addToUi();
}

function openPAMDashboard() {
  const html = HtmlService.createHtmlOutputFromFile('PAM_UI')
    .setWidth(1400)
    .setHeight(900)
    .setTitle('⚡ Project Arbitrage Module — Command Center');
  SpreadsheetApp.getUi().showModalDialog(html, '⚡ Project Arbitrage Module — Command Center');
}

// ── Test Data Seeder ──────────────────────────────────────

function seedPAMTestData() {
  initializePAMSheets();

  // Projects
  const projects = [
    { name: 'Berkeley House Rebuild', type: 'Property Rehab',         category: 'Real Estate', budget: 15000, priority: 'High',   status: 'Active', description: 'Full rehab on Berkeley rental property' },
    { name: 'Yamaha Blaster Build',   type: 'ATV/Powersports Build',  category: 'Powersports', budget: 2500,  priority: 'Medium', status: 'Active', description: 'YFS200 full restore and performance build' },
    { name: 'CarHawk Flip 04 — Mustang', type: 'Vehicle Flip',        category: 'Vehicles',    budget: 4000,  priority: 'High',   status: 'Active', description: '2015 S550 Mustang GT cosmetic flip' }
  ];
  projects.forEach(p => addProject(p));

  // Re-read project IDs
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const projSheet = ss.getSheetByName('PAM_Projects');
  const projIds = projSheet.getRange(2, 1, 3, 1).getValues().flat();
  const [p1, p2, p3] = projIds;

  // Needs
  const needs = [
    { projectId: p1, item: 'Mini Split AC Unit',  keywords: 'mini split,ductless,heat pump,condenser,air handler,mr slim,mrcool,mitsubishi mini split', category: 'HVAC',        brand: 'Mitsubishi,Pioneer,MrCool', condition: 'Good', qtyNeeded: 1, targetPrice: 250, maxPrice: 500, priority: 'Critical',    status: 'Open' },
    { projectId: p1, item: 'Exterior Entry Door',  keywords: 'exterior door,entry door,front door,steel door,fiberglass door,exterior entry', category: 'Exterior',    brand: '',                condition: 'Good', qtyNeeded: 1, targetPrice: 100, maxPrice: 250, priority: 'Important',  status: 'Open' },
    { projectId: p1, item: 'Bathroom Vanity',      keywords: 'vanity,bathroom vanity,sink cabinet,bath vanity,36 inch vanity', category: 'Plumbing',    brand: '',                condition: 'Good', qtyNeeded: 1, targetPrice: 75,  maxPrice: 200, priority: 'Nice to Have',status: 'Open' },
    { projectId: p2, item: 'Front Plastics Set',   keywords: 'blaster plastics,yfs200 plastic,yamaha blaster fender,blaster fenders,blaster body,blaster front fender', category: 'Body/Cosmetic',brand: 'Yamaha',          condition: 'Good', qtyNeeded: 1, targetPrice: 40,  maxPrice: 80,  priority: 'Critical',    status: 'Open' },
    { projectId: p2, item: 'Brake Setup',          keywords: 'blaster brakes,yfs200 brake,yamaha blaster caliper,blaster rotor,blaster master cylinder', category: 'Drivetrain',  brand: 'Yamaha',          condition: 'Good', qtyNeeded: 1, targetPrice: 30,  maxPrice: 60,  priority: 'Important',  status: 'Open' },
    { projectId: p3, item: 'Headlight Assembly',   keywords: 'mustang headlight,mustang headlamp,2015 mustang light,s550 headlight,mustang projector headlight', category: 'Exterior',    brand: 'Ford',            condition: 'Good', qtyNeeded: 1, targetPrice: 80,  maxPrice: 150, priority: 'Critical',    status: 'Open' },
    { projectId: p3, item: 'Front Seat Set',       keywords: 'mustang seats,s550 seats,mustang leather seats,mustang seat set,2015 mustang interior', category: 'Interior',    brand: 'Ford',            condition: 'Good', qtyNeeded: 1, targetPrice: 150, maxPrice: 300, priority: 'Important',  status: 'Open' }
  ];
  needs.forEach(n => addNeed(n));

  SpreadsheetApp.getUi().alert('⚡ PAM test data seeded: 3 projects, 7 needs.');
}
