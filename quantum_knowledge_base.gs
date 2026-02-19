// =========================================================
// FILE: quantum-knowledge-base.gs - Knowledge Base
// =========================================================

function populateKnowledgeBase() {
  const sheet = getQuantumSheet(QUANTUM_SHEETS.KNOWLEDGE.name);

  // Only populate if empty
  if (sheet.getLastRow() > 1) return;

  const knowledgeData = [
    ['Honda', 'Civic', '2016-2020', 'Reliability', 'AC Compressor ($1200)', 'Low', 'Very High', 85, 12, 12000, 18000, 'Spring/Summer', 'First-time buyers', 'Start high, they hold value', 'CVT issues in some years', 92, new Date(), 156, 95],
    ['Toyota', 'Camry', '2015-2020', 'Reliability', 'None common', 'Very Low', 'Very High', 90, 10, 15000, 25000, 'Year-round', 'Families', 'Firm pricing, high demand', 'Flood damage', 94, new Date(), 203, 97],
    ['Honda', 'Accord', '2016-2020', 'Reliability', 'Turbo issues (1.5T)', 'Low', 'High', 88, 14, 16000, 24000, 'Year-round', 'Professionals', 'Feature-based negotiation', '1.5T engine concerns', 90, new Date(), 178, 93],
    ['Ford', 'F-150', '2015-2020', 'Trucks', 'Cam phasers ($2000)', 'Medium', 'Very High', 82, 18, 25000, 45000, 'Fall/Winter', 'Contractors', 'Focus on capability', 'Aluminum body repairs', 88, new Date(), 245, 91],
    ['Chevrolet', 'Silverado', '2014-2019', 'Trucks', 'AFM issues', 'Medium', 'High', 80, 20, 22000, 40000, 'Fall/Winter', 'Blue collar', 'Compare to F-150', 'Transmission issues', 85, new Date(), 198, 89],
    ['Toyota', 'RAV4', '2016-2020', 'SUV', 'None common', 'Very Low', 'Very High', 88, 11, 20000, 28000, 'Year-round', 'Young families', 'Quick sales', 'AWD premium', 91, new Date(), 167, 94],
    ['Honda', 'CR-V', '2016-2020', 'SUV', 'Oil dilution (1.5T)', 'Low', 'High', 86, 13, 19000, 27000, 'Year-round', 'Suburban families', 'Safety features sell', '1.5T issues', 89, new Date(), 189, 92],
    ['Nissan', 'Altima', '2015-2020', 'Sedan', 'CVT failure ($4000)', 'High', 'Medium', 65, 25, 10000, 18000, 'Spring/Summer', 'Budget buyers', 'Price aggressively', 'CVT reliability', 72, new Date(), 134, 78],
    ['Mazda', 'CX-5', '2016-2020', 'SUV', 'None common', 'Very Low', 'High', 84, 15, 18000, 26000, 'Year-round', 'Enthusiasts', 'Emphasize driving', 'Limited cargo', 87, new Date(), 145, 90],
    ['Jeep', 'Wrangler', '2015-2020', 'SUV', 'Death wobble', 'Medium', 'Very High', 78, 22, 25000, 40000, 'Spring/Summer', 'Outdoor enthusiasts', 'Mods add value', 'Rough ride', 83, new Date(), 201, 86]
  ];

  knowledgeData.forEach((row, index) => {
    const kbRow = [generateQuantumId('KB')].concat(row);
    sheet.getRange(index + 2, 1, 1, kbRow.length).setValues([kbRow]);
  });

  logQuantum('Knowledge Base', 'Populated with initial vehicle data');
}

function getVehicleKnowledge(make, model, year) {
  const sheet = getQuantumSheet(QUANTUM_SHEETS.KNOWLEDGE.name);
  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === make && data[i][2] === model) {
      const years = data[i][3];
      if (!years) continue;

      const yearRange = years.split('-').map(y => parseInt(y));
      const vehicleYear = parseInt(year);

      if (vehicleYear >= yearRange[0] && vehicleYear <= yearRange[1]) {
        return {
          commonIssues: data[i][5],
          repairCosts: data[i][6],
          marketDemand: data[i][7],
          quickFlipScore: data[i][8],
          avgDaysToSell: data[i][9],
          priceRange: {low: data[i][10], high: data[i][11]},
          bestMonths: data[i][12],
          targetBuyer: data[i][13],
          negotiationTips: data[i][14],
          redFlags: data[i][15],
          successRate: data[i][16]
        };
      }
    }
  }

  return null;
}
