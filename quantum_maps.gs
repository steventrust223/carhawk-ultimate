// =========================================================
// FILE: quantum_maps.gs - Maps & Location Intelligence
// =========================================================
// Google Maps API integration for real distance calculations,
// geocoding, market heat maps, and deal location mapping.
// Uses Apps Script's built-in Maps service (no API key needed).
// =========================================================

/**
 * Calculate real driving distance between home ZIP and target ZIP
 * using Google Maps Directions API (built into Apps Script).
 * Falls back to ZIP-based approximation if Maps fails.
 */
function calculateRealDistance(targetZip) {
  if (!targetZip) return { miles: 999, minutes: 0, method: 'unknown' };

  var homeZip = getQuantumSetting('HOME_ZIP') || '63101';
  var cacheKey = 'DIST_' + homeZip + '_' + targetZip;

  // Check cache first (distances don't change often)
  var cached = CacheService.getScriptCache().get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  try {
    var directions = Maps.newDirectionFinder()
      .setOrigin(homeZip)
      .setDestination(String(targetZip))
      .setMode(Maps.DirectionFinder.Mode.DRIVING)
      .getDirections();

    if (directions.routes && directions.routes.length > 0) {
      var leg = directions.routes[0].legs[0];
      var result = {
        miles: Math.round(leg.distance.value * 0.000621371), // meters to miles
        minutes: Math.round(leg.duration.value / 60),
        driveTime: leg.duration.text,
        method: 'google_maps'
      };

      // Cache for 24 hours
      CacheService.getScriptCache().put(cacheKey, JSON.stringify(result), 86400);
      return result;
    }
  } catch (e) {
    logQuantum('Maps Distance Error', e.toString());
  }

  // Fallback to ZIP approximation
  var zipDiff = Math.abs(parseInt(homeZip) - parseInt(targetZip));
  return {
    miles: Math.min(zipDiff * 0.1, 500),
    minutes: 0,
    driveTime: 'N/A',
    method: 'zip_estimate'
  };
}

/**
 * Geocode a location string (ZIP, city/state, or address) to lat/lng.
 * Results are cached to avoid hitting API limits.
 */
function geocodeLocation(location) {
  if (!location) return null;

  var loc = String(location).trim();
  if (!loc) return null;

  var cacheKey = 'GEO_' + loc.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 200);
  var cached = CacheService.getScriptCache().get(cacheKey);
  if (cached) return JSON.parse(cached);

  try {
    var response = Maps.newGeocoder().geocode(loc);
    if (response.results && response.results.length > 0) {
      var geo = response.results[0].geometry.location;
      var addr = response.results[0].formatted_address;
      var result = {
        lat: geo.lat,
        lng: geo.lng,
        address: addr,
        success: true
      };
      CacheService.getScriptCache().put(cacheKey, JSON.stringify(result), 86400);
      return result;
    }
  } catch (e) {
    logQuantum('Geocode Error', loc + ': ' + e.toString());
  }

  return null;
}

/**
 * Build map data from deal database for heat map and deal map views.
 * Returns arrays of deal locations with metrics for visualization.
 */
function buildMapData() {
  var sheet = getQuantumSheet(QUANTUM_SHEETS.DATABASE.name);
  if (!sheet) return { deals: [], stats: {} };

  var data = sheet.getDataRange().getValues();
  var deals = [];
  var locationStats = {};
  var homeZip = getQuantumSetting('HOME_ZIP') || '63101';

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var dealId = row[0];
    var platform = row[2] || '';
    var year = row[5] || '';
    var make = row[6] || '';
    var model = row[7] || '';
    var price = row[13] || 0;
    var location = row[14] || '';
    var zip = row[15] || '';
    var distance = row[16] || 0;
    var profit = row[26] || 0;
    var roi = row[27] || 0;
    var verdict = row[42] || '';
    var confidence = row[41] || 0;

    if (!dealId || !location) continue;

    // Group by ZIP/area for heat map
    var areaKey = zip || location.substring(0, 20);
    if (!locationStats[areaKey]) {
      locationStats[areaKey] = {
        location: location,
        zip: zip,
        dealCount: 0,
        totalProfit: 0,
        avgROI: 0,
        hotDeals: 0,
        platforms: {},
        roiSum: 0
      };
    }

    locationStats[areaKey].dealCount++;
    locationStats[areaKey].totalProfit += profit;
    locationStats[areaKey].roiSum += roi;
    locationStats[areaKey].avgROI = Math.round(locationStats[areaKey].roiSum / locationStats[areaKey].dealCount);
    if (verdict.indexOf('HOT') > -1) locationStats[areaKey].hotDeals++;
    locationStats[areaKey].platforms[platform] = (locationStats[areaKey].platforms[platform] || 0) + 1;

    deals.push({
      dealId: dealId,
      title: year + ' ' + make + ' ' + model,
      platform: platform,
      price: price,
      location: location,
      zip: zip,
      distance: distance,
      profit: profit,
      roi: roi,
      verdict: verdict,
      confidence: confidence
    });
  }

  // Convert location stats to array
  var areas = [];
  for (var key in locationStats) {
    areas.push(locationStats[key]);
  }

  // Sort areas by deal count
  areas.sort(function(a, b) { return b.dealCount - a.dealCount; });

  return {
    deals: deals,
    areas: areas.slice(0, 50), // Top 50 areas
    homeZip: homeZip,
    totalDeals: deals.length
  };
}

/**
 * Build Browse.AI robot coverage data showing which areas are being scraped.
 */
function buildCoverageData() {
  var coverage = [];
  var props = PropertiesService.getScriptProperties();

  // Get linked robots
  var linkedRobotsJson = props.getProperty('BROWSE_AI_LINKED_ROBOTS');
  var linkedRobots = linkedRobotsJson ? JSON.parse(linkedRobotsJson) : {};

  // Get robot registry platforms
  var platforms = getSupportedPlatforms ? getSupportedPlatforms() : {};

  for (var robotId in linkedRobots) {
    var robot = linkedRobots[robotId];
    var platformKey = robot.marketplace || robot.platform || '';
    var config = ROBOT_REGISTRY ? ROBOT_REGISTRY[platformKey] : null;

    coverage.push({
      robotId: robotId,
      name: robot.name || platformKey,
      platform: platformKey,
      regions: config && config.searchConfig ? config.searchConfig.defaultRegions || [] : [],
      maxPages: config && config.searchConfig ? config.searchConfig.maxPages || 5 : 5,
      refreshInterval: config && config.searchConfig ? config.searchConfig.refreshInterval || '6h' : '6h',
      status: robot.status || 'active'
    });
  }

  // Also check integration sheet for registered robots
  var integrations = getActiveIntegrations();
  var browseIntegrations = integrations.filter(function(i) { return i.provider === 'Browse.ai'; });

  browseIntegrations.forEach(function(integration) {
    var alreadyAdded = coverage.some(function(c) { return c.name === integration.name; });
    if (!alreadyAdded) {
      coverage.push({
        robotId: integration.integrationId,
        name: integration.name,
        platform: integration.notes || 'Unknown',
        regions: [],
        status: integration.status || 'active'
      });
    }
  });

  return coverage;
}

/**
 * Geocode all deal locations in batch (up to 50 per run to avoid limits).
 * Stores results in a cache sheet for reuse.
 */
function batchGeocodeDeals() {
  var mapData = buildMapData();
  var geocoded = 0;
  var failed = 0;

  // Process unique locations
  var seen = {};
  for (var i = 0; i < mapData.deals.length && geocoded < 50; i++) {
    var deal = mapData.deals[i];
    var locKey = deal.zip || deal.location;
    if (!locKey || seen[locKey]) continue;
    seen[locKey] = true;

    var geo = geocodeLocation(locKey);
    if (geo) {
      geocoded++;
    } else {
      failed++;
    }

    // Small delay to avoid rate limiting
    if (geocoded % 10 === 0) Utilities.sleep(1000);
  }

  return { geocoded: geocoded, failed: failed, total: Object.keys(seen).length };
}

/**
 * Get map data with geocoded coordinates for the MarketMap HTML view.
 */
function getMapViewData() {
  var mapData = buildMapData();

  // Geocode the home location
  var homeGeo = geocodeLocation(mapData.homeZip);

  // Geocode deal locations (use cached results)
  var geoDeals = [];
  var seen = {};

  for (var i = 0; i < mapData.deals.length; i++) {
    var deal = mapData.deals[i];
    var locKey = deal.zip || deal.location;
    if (!locKey) continue;

    // Geocode if not seen yet
    if (!seen[locKey]) {
      seen[locKey] = geocodeLocation(locKey);
    }

    if (seen[locKey]) {
      deal.lat = seen[locKey].lat;
      deal.lng = seen[locKey].lng;
      geoDeals.push(deal);
    }
  }

  // Geocode area stats
  var geoAreas = [];
  for (var j = 0; j < mapData.areas.length; j++) {
    var area = mapData.areas[j];
    var areaKey = area.zip || area.location;
    if (areaKey && seen[areaKey]) {
      area.lat = seen[areaKey].lat;
      area.lng = seen[areaKey].lng;
      geoAreas.push(area);
    }
  }

  return {
    home: homeGeo || { lat: 38.627, lng: -90.199 }, // Default: St. Louis
    deals: geoDeals,
    areas: geoAreas,
    totalDeals: mapData.totalDeals
  };
}

/**
 * Get coverage map data with geocoded regions.
 */
function getCoverageMapData() {
  var coverage = buildCoverageData();
  var homeGeo = geocodeLocation(getQuantumSetting('HOME_ZIP') || '63101');

  // Geocode coverage regions
  coverage.forEach(function(robot) {
    if (robot.regions && robot.regions.length > 0) {
      robot.geoRegions = [];
      robot.regions.forEach(function(region) {
        var geo = geocodeLocation(region);
        if (geo) {
          robot.geoRegions.push({
            name: region,
            lat: geo.lat,
            lng: geo.lng
          });
        }
      });
    }
  });

  return {
    home: homeGeo || { lat: 38.627, lng: -90.199 },
    robots: coverage
  };
}

// ---- Menu handler functions ----

function openMarketHeatMap() {
  // Batch geocode first
  batchGeocodeDeals();

  var template = HtmlService.createTemplateFromFile('MarketMap');
  template.mode = 'heatmap';

  var html = template.evaluate()
    .setWidth(1100)
    .setHeight(750)
    .setTitle('Market Heat Map');

  SpreadsheetApp.getUi().showModalDialog(html, '📍 Market Heat Map');
}

function openDealMap() {
  batchGeocodeDeals();

  var template = HtmlService.createTemplateFromFile('MarketMap');
  template.mode = 'deals';

  var html = template.evaluate()
    .setWidth(1100)
    .setHeight(750)
    .setTitle('Deal Map');

  SpreadsheetApp.getUi().showModalDialog(html, '📍 Deal Map');
}

function openCoverageMap() {
  var template = HtmlService.createTemplateFromFile('MarketMap');
  template.mode = 'coverage';

  var html = template.evaluate()
    .setWidth(1100)
    .setHeight(750)
    .setTitle('Browse.AI Coverage Map');

  SpreadsheetApp.getUi().showModalDialog(html, '📍 Browse.AI Coverage Map');
}
