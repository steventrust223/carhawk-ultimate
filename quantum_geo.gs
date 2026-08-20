// =========================================================
// FILE: quantum_geo.gs - Location Resolution & Distance
// =========================================================
// Marketplace listings rarely carry a ZIP. Facebook gives
// "Chesterfield, MO", Craigslist gives a region name. The old
// distance model only read a 5-digit ZIP, so every listing fell
// back to 999 miles and was flagged High location risk, which
// penalised Market Advantage on every deal.
//
// This module resolves "City, ST" to coordinates and measures
// real great-circle distance from HOME_COORDINATES. When a
// location cannot be resolved at all, distance is null and the
// caller treats risk as Unknown rather than worst-case.
// =========================================================

/**
 * Coordinates for the St. Louis trading area plus cities seen in
 * marketplace feeds. Keys are lowercase "city|state".
 */
const QUANTUM_CITY_COORDS = {
  // ---- Missouri (St. Louis metro & outstate) ----
  'st louis|mo': {lat: 38.6270, lng: -90.1994},
  'saint louis|mo': {lat: 38.6270, lng: -90.1994},
  'ferguson|mo': {lat: 38.7442, lng: -90.3054},
  'florissant|mo': {lat: 38.7892, lng: -90.3223},
  'hazelwood|mo': {lat: 38.7714, lng: -90.3706},
  'maryland heights|mo': {lat: 38.7128, lng: -90.4298},
  'chesterfield|mo': {lat: 38.6631, lng: -90.5771},
  'kirkwood|mo': {lat: 38.5834, lng: -90.4068},
  'ballwin|mo': {lat: 38.5950, lng: -90.5462},
  'fenton|mo': {lat: 38.5131, lng: -90.4390},
  'arnold|mo': {lat: 38.4306, lng: -90.3773},
  'st charles|mo': {lat: 38.7881, lng: -90.4974},
  'saint charles|mo': {lat: 38.7881, lng: -90.4974},
  'st peters|mo': {lat: 38.7875, lng: -90.6298},
  'saint peters|mo': {lat: 38.7875, lng: -90.6298},
  'o fallon|mo': {lat: 38.8106, lng: -90.6998},
  'ofallon|mo': {lat: 38.8106, lng: -90.6998},
  'wentzville|mo': {lat: 38.8114, lng: -90.8529},
  'wright city|mo': {lat: 38.8281, lng: -91.0207},
  'pacific|mo': {lat: 38.4820, lng: -90.7418},
  'st clair|mo': {lat: 38.3448, lng: -90.9807},
  'saint clair|mo': {lat: 38.3448, lng: -90.9807},
  'union|mo': {lat: 38.4500, lng: -91.0085},
  'washington|mo': {lat: 38.5581, lng: -91.0121},
  'hillsboro|mo': {lat: 38.2320, lng: -90.5629},
  'festus|mo': {lat: 38.2206, lng: -90.3960},
  'troy|mo': {lat: 38.9792, lng: -90.9807},
  'barnhart|mo': {lat: 38.3384, lng: -90.4207},
  'bowling green|mo': {lat: 39.3417, lng: -91.1954},
  'imperial|mo': {lat: 38.3695, lng: -90.3779},
  'de soto|mo': {lat: 38.1395, lng: -90.5554},
  'warrenton|mo': {lat: 38.8114, lng: -91.1418},
  'eureka|mo': {lat: 38.5023, lng: -90.6274},
  'high ridge|mo': {lat: 38.4642, lng: -90.5379},
  'house springs|mo': {lat: 38.4184, lng: -90.5751},
  'sullivan|mo': {lat: 38.2081, lng: -91.1604},
  'moscow mills|mo': {lat: 38.9481, lng: -90.9187},
  'bridgeton|mo': {lat: 38.7670, lng: -90.4115},
  'overland|mo': {lat: 38.7014, lng: -90.3629},
  'webster groves|mo': {lat: 38.5926, lng: -90.3573},
  'affton|mo': {lat: 38.5504, lng: -90.3329},
  'oakville|mo': {lat: 38.4703, lng: -90.3051},
  'manchester|mo': {lat: 38.5972, lng: -90.5098},
  'wildwood|mo': {lat: 38.5828, lng: -90.6626},
  'cottleville|mo': {lat: 38.7461, lng: -90.6540},
  'lake st louis|mo': {lat: 38.7975, lng: -90.7857},
  'columbia|mo': {lat: 38.9517, lng: -92.3341},
  'jefferson city|mo': {lat: 38.5767, lng: -92.1735},
  'rolla|mo': {lat: 37.9514, lng: -91.7713},
  'springfield|mo': {lat: 37.2090, lng: -93.2923},
  'kansas city|mo': {lat: 39.0997, lng: -94.5786},
  'cape girardeau|mo': {lat: 37.3059, lng: -89.5181},
  'joplin|mo': {lat: 37.0842, lng: -94.5133},

  // ---- Illinois (Metro East & downstate) ----
  'belleville|il': {lat: 38.5200, lng: -89.9840},
  'o fallon|il': {lat: 38.5920, lng: -89.9110},
  'ofallon|il': {lat: 38.5920, lng: -89.9110},
  'edwardsville|il': {lat: 38.8114, lng: -89.9532},
  'collinsville|il': {lat: 38.6703, lng: -89.9845},
  'granite city|il': {lat: 38.7014, lng: -90.1487},
  'alton|il': {lat: 38.8906, lng: -90.1843},
  'east st louis|il': {lat: 38.6245, lng: -90.1510},
  'waterloo|il': {lat: 38.3403, lng: -90.1512},
  'mount vernon|il': {lat: 38.3173, lng: -88.9031},
  'opdyke|il': {lat: 38.2664, lng: -88.7817},
  'effingham|il': {lat: 39.1200, lng: -88.5434},
  'springfield|il': {lat: 39.7817, lng: -89.6501},
  'decatur|il': {lat: 39.8403, lng: -88.9548},
  'champaign|il': {lat: 40.1164, lng: -88.2434},
  'peoria|il': {lat: 40.6936, lng: -89.5890},
  'chicago|il': {lat: 41.8781, lng: -87.6298},

  // ---- Neighbouring states, common in wide-radius searches ----
  'louisville|ky': {lat: 38.2527, lng: -85.7585},
  'nashville|tn': {lat: 36.1627, lng: -86.7816},
  'memphis|tn': {lat: 35.1495, lng: -90.0490},
  'little rock|ar': {lat: 34.7465, lng: -92.2896},
  'tulsa|ok': {lat: 36.1540, lng: -95.9928},
  'oklahoma city|ok': {lat: 35.4676, lng: -97.5164},
  'des moines|ia': {lat: 41.5868, lng: -93.6250},
  'toledo|ia': {lat: 41.9986, lng: -92.5779},
  'indianapolis|in': {lat: 39.7684, lng: -86.1581},
  'lafayette|in': {lat: 40.4167, lng: -86.8753},
  'milwaukee|wi': {lat: 43.0389, lng: -87.9065},
  'minneapolis|mn': {lat: 44.9778, lng: -93.2650},
  'hopkins|mn': {lat: 44.9250, lng: -93.4127},
  'detroit|mi': {lat: 42.3314, lng: -83.0458},
  'dearborn|mi': {lat: 42.3223, lng: -83.1763},
  'dallas|tx': {lat: 32.7767, lng: -96.7970},
  'plano|tx': {lat: 33.0198, lng: -96.6989}
};

/**
 * Approximate geographic centre of each state, used when a city is
 * not in the table. Coarse, but far better than assuming 999 miles.
 */
const QUANTUM_STATE_COORDS = {
  al: {lat: 32.8, lng: -86.8},  ak: {lat: 64.0, lng: -152.0}, az: {lat: 34.3, lng: -111.7},
  ar: {lat: 34.9, lng: -92.4},  ca: {lat: 37.2, lng: -119.4}, co: {lat: 39.0, lng: -105.5},
  ct: {lat: 41.6, lng: -72.7},  de: {lat: 39.0, lng: -75.5},  fl: {lat: 28.6, lng: -82.4},
  ga: {lat: 32.6, lng: -83.4},  hi: {lat: 20.3, lng: -156.4}, id: {lat: 44.4, lng: -114.6},
  il: {lat: 40.0, lng: -89.2},  in: {lat: 39.9, lng: -86.3},  ia: {lat: 42.1, lng: -93.5},
  ks: {lat: 38.5, lng: -98.4},  ky: {lat: 37.5, lng: -85.3},  la: {lat: 31.1, lng: -92.0},
  me: {lat: 45.4, lng: -69.2},  md: {lat: 39.0, lng: -76.8},  ma: {lat: 42.3, lng: -71.8},
  mi: {lat: 44.3, lng: -85.4},  mn: {lat: 46.3, lng: -94.3},  ms: {lat: 32.7, lng: -89.7},
  mo: {lat: 38.4, lng: -92.5},  mt: {lat: 47.0, lng: -109.6}, ne: {lat: 41.5, lng: -99.8},
  nv: {lat: 39.3, lng: -116.6}, nh: {lat: 43.7, lng: -71.6},  nj: {lat: 40.2, lng: -74.7},
  nm: {lat: 34.4, lng: -106.1}, ny: {lat: 42.9, lng: -75.5},  nc: {lat: 35.5, lng: -79.4},
  nd: {lat: 47.4, lng: -100.5}, oh: {lat: 40.3, lng: -82.8},  ok: {lat: 35.6, lng: -97.5},
  or: {lat: 43.9, lng: -120.6}, pa: {lat: 40.9, lng: -77.8},  ri: {lat: 41.7, lng: -71.6},
  sc: {lat: 33.9, lng: -80.9},  sd: {lat: 44.4, lng: -100.2}, tn: {lat: 35.8, lng: -86.4},
  tx: {lat: 31.5, lng: -99.3},  ut: {lat: 39.3, lng: -111.7}, vt: {lat: 44.1, lng: -72.7},
  va: {lat: 37.5, lng: -78.9},  wa: {lat: 47.4, lng: -120.4}, wv: {lat: 38.6, lng: -80.6},
  wi: {lat: 44.6, lng: -89.7},  wy: {lat: 43.0, lng: -107.6}
};

/**
 * Great-circle distance in miles between two {lat, lng} points.
 */
function haversineMiles(a, b) {
  const R = 3958.8; // Earth radius in miles
  const toRad = function (deg) { return deg * Math.PI / 180; };

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Resolve a marketplace location string to coordinates.
 * Accepts "Chesterfield, MO", "St. Louis, Missouri", "63101", etc.
 *
 * @return {{lat:number, lng:number, precision:string}|null}
 */
function geocodeQuantumLocation(locationStr) {
  if (!locationStr) return null;

  const raw = String(locationStr).trim();
  if (!raw) return null;

  // Full state names -> postal abbreviations (only those we may meet)
  const stateNames = {
    missouri: 'mo', illinois: 'il', kansas: 'ks', arkansas: 'ar', iowa: 'ia',
    indiana: 'in', kentucky: 'ky', tennessee: 'tn', oklahoma: 'ok',
    nebraska: 'ne', wisconsin: 'wi', minnesota: 'mn', michigan: 'mi',
    ohio: 'oh', texas: 'tx'
  };

  // Split "City, ST" — take the last comma-separated chunk as the state
  const parts = raw.split(',').map(function (p) { return p.trim(); });
  let city = '';
  let state = '';

  if (parts.length >= 2) {
    city = parts[parts.length - 2];
    state = parts[parts.length - 1];
  } else {
    city = parts[0];
  }

  const normCity = city
    .toLowerCase()
    .replace(/\./g, '')          // "St. Louis" -> "st louis"
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  let normState = state.toLowerCase().replace(/[^a-z]/g, '');
  if (stateNames[normState]) normState = stateNames[normState];

  // 1) Exact city match
  if (normCity && normState) {
    const hit = QUANTUM_CITY_COORDS[normCity + '|' + normState];
    if (hit) return {lat: hit.lat, lng: hit.lng, precision: 'city'};
  }

  // 2) City name alone, if unambiguous across the table
  if (normCity) {
    const matches = Object.keys(QUANTUM_CITY_COORDS).filter(function (k) {
      return k.split('|')[0] === normCity;
    });
    if (matches.length === 1) {
      const only = QUANTUM_CITY_COORDS[matches[0]];
      return {lat: only.lat, lng: only.lng, precision: 'city'};
    }
  }

  // 3) State centroid
  if (normState && QUANTUM_STATE_COORDS[normState]) {
    const st = QUANTUM_STATE_COORDS[normState];
    return {lat: st.lat, lng: st.lng, precision: 'state'};
  }

  return null;
}

/**
 * Home base coordinates for distance measurement.
 */
function getQuantumHomeCoords() {
  try {
    const lat = parseFloat(getQuantumSetting('HOME_LAT'));
    const lng = parseFloat(getQuantumSetting('HOME_LNG'));
    if (!isNaN(lat) && !isNaN(lng)) return {lat: lat, lng: lng};
  } catch (e) {
    // Settings sheet may not exist yet — fall through to the default
  }
  return QUANTUM_CONFIG.HOME_COORDINATES;
}
