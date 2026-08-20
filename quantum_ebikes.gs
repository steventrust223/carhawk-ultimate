// =========================================================
// FILE: quantum_ebikes.gs - E-Bike Sourcing Support
// =========================================================
// E-bikes break several assumptions the vehicle pipeline makes:
//
//   * Value: a used e-bike is $150-$5,000, not $4,000-$40,000. Running
//     one through the car curves (or even the powersports segment, base
//     $11,000) overvalues it by an order of magnitude.
//   * Mileage: most listings have no odometer at all, and the ones that
//     do read in hundreds of miles. The car mileage curve is meaningless
//     here — battery age drives value far more than distance.
//   * Year: frequently absent ("Rad Power RadRunner, barely used").
//   * Holding cost: a flat $500 is 40% of a $1,200 e-bike deal.
//
// This module supplies e-bike detection, brand tiering and valuation.
// The generic engine defers to it whenever a listing is an e-bike.
// =========================================================

/**
 * Brand tiers. Resale tracks the brand's new price far more tightly than
 * it does for cars, because the used e-bike market is brand-driven.
 */
const EBIKE_BRANDS = {
  premium: /\b(specialized|turbo levo|turbo vado|turbo como|trek|allant|rail|powerfly|riese|m[uü]ller|gazelle|bulls|haibike|cannondale|giant|liv|scott|cube|orbea|santa cruz|yeti|pivot|tern|benno|urban arrow|stromer|vanmoof|cowboy|priority|bosch|brose|shimano steps)\b/i,
  mid: /\b(aventon|level|pace|sinch|abound|ramblas|ride ?1 ?up|super ?73|velotric|blix|juiced|electric bike company|dost|surface ?604|biktrix|frey|watt wagons|tern|benno)\b/i,
  value: /\b(rad ?power|radrunner|radrover|radcity|radwagon|radexpand|himiway|lectric|xp ?3|xpress|magicycle|engwe|heybike|nakto|troxus|mokwheel|eahora|vtuvia|rattan|denago|jetson bolt pro)\b/i,
  budget: /\b(ancheer|swagtron|hyper|razor|jetson|viribus|vivi|totguard|kbo|varun|gotrax|hiboy|caroma|shaofu|speedrid|cyrusher|onesport|dyu|fiido|eleglide|isinwheel)\b/i
};

/**
 * Segment specs for e-bikes. Retention is steeper than for vehicles:
 * battery capacity fades and model refreshes are frequent.
 */
const EBIKE_SEGMENTS = {
  ebikePremium: {base: 6500, retention: 0.83, floor: 700},
  ebikeMid:     {base: 2200, retention: 0.82, floor: 350},
  ebikeValue:   {base: 1400, retention: 0.82, floor: 250},
  ebikeBudget:  {base: 800,  retention: 0.75, floor: 120}
};

/**
 * Words that identify a listing as an e-bike rather than a vehicle.
 * "ebike" and "e-bike" alone are decisive; the rest need corroboration
 * from a brand or another cue, so that "electric" in a car listing
 * ("electric windows", "electric blue") does not misclassify it.
 */
const EBIKE_STRONG_TERMS = /\b(e-?bike|e-?bikes|electric bicycle|electric bike|pedal ?assec?t|pedal assist|e-?mtb|electric mountain bike|electric scooter|e-?scooter|electric trike)\b/i;
const EBIKE_WEAK_TERMS = /\b(bicycle|bike|cycling|mountain bike|cruiser|commuter|fat tire|step-?thru|step-?through|cargo bike)\b/i;

/**
 * Decide whether a parsed listing is an e-bike.
 *
 * Deliberately conservative: a false positive would price a car with the
 * e-bike curve and make a real deal look worthless.
 */
function isEbikeListing(parsed) {
  const text = [parsed.title, parsed.model, parsed.make, parsed.description]
    .filter(Boolean).join(' ');
  if (!text) return false;

  // An explicit e-bike phrase settles it.
  if (EBIKE_STRONG_TERMS.test(text)) return true;

  // A known e-bike brand plus any bike word.
  const brandHit = EBIKE_BRANDS.premium.test(text) ||
                   EBIKE_BRANDS.mid.test(text) ||
                   EBIKE_BRANDS.value.test(text) ||
                   EBIKE_BRANDS.budget.test(text);
  if (brandHit && EBIKE_WEAK_TERMS.test(text)) return true;

  return false;
}

/**
 * Tier an e-bike by brand, defaulting to mid-market when the brand is
 * unrecognised — most unbranded listings sit there, and defaulting to
 * premium would inflate the estimate.
 */
function classifyEbikeSegment(parsed) {
  const text = [parsed.title, parsed.model, parsed.make, parsed.description]
    .filter(Boolean).join(' ');

  if (EBIKE_BRANDS.premium.test(text)) return 'ebikePremium';
  if (EBIKE_BRANDS.budget.test(text)) return 'ebikeBudget';
  if (EBIKE_BRANDS.value.test(text)) return 'ebikeValue';
  if (EBIKE_BRANDS.mid.test(text)) return 'ebikeMid';
  return 'ebikeValue';
}

/**
 * Mileage adjustment for e-bikes.
 *
 * Distance matters far less than on a car — a 1,500-mile e-bike is well
 * used, but the battery, not the odometer, sets the value. Gentle
 * penalties only, and never a low-mileage bonus, since almost every
 * used e-bike has low miles.
 */
function ebikeMileageFactor(mileage) {
  if (!mileage || mileage <= 0) return 1.0; // Usually simply not stated
  if (mileage > 5000) return 0.78;
  if (mileage > 3000) return 0.86;
  if (mileage > 1500) return 0.93;
  return 1.0;
}

/**
 * Estimate an e-bike's market value.
 *
 * @param {Object} parsed  parsed listing
 * @return {number} estimated resale value in dollars
 */
function estimateEbikeMarketValue(parsed) {
  const segment = classifyEbikeSegment(parsed);
  const spec = EBIKE_SEGMENTS[segment];

  // Year is often missing on e-bike listings. Assume a mid-life example
  // rather than treating it as brand new, which would overvalue it.
  const currentYear = new Date().getFullYear();
  const year = parseInt(parsed.year);
  const age = isNaN(year) ? 3 : Math.max(0, Math.min(currentYear - year, 15));

  let value = spec.base * Math.pow(spec.retention, age);

  value *= ebikeMileageFactor(parsed.mileage);

  const conditionMultipliers = {
    'Excellent': 1.15,
    'Very Good': 1.08,
    'Very good': 1.08,
    'Like new': 1.18,
    'Good': 1.0,
    'Fair': 0.80,
    'Poor': 0.55,
    'Salvage': 0.30
  };
  value *= conditionMultipliers[parsed.condition] || 0.95;

  // Battery condition is the single biggest value driver, and sellers
  // usually say so in plain language.
  const text = String(parsed.description || '') + ' ' + String(parsed.title || '');
  if (/\b(new battery|replaced battery|new cells|battery replaced)\b/i.test(text)) {
    value *= 1.20;
  }
  if (/\b(battery (is )?(dead|bad|not working|needs replac)|no battery|needs battery|won'?t (hold )?charge|doesn'?t charge)\b/i.test(text)) {
    value *= 0.45;
  }

  return Math.max(Math.round(value), spec.floor);
}
