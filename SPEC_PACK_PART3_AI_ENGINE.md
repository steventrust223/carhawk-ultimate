# CarHawk Ultimate -- AI Engine & Deal Analysis
## Spec Pack Part 3 of 8 | QUANTUM-2.0.0

---

### A) AI Analysis Pipeline

**Source Files:** quantum_ai.gs (299 lines), quantum_calculations.gs (371 lines), quantum_knowledge_base.gs (65 lines), quantum_fallback.gs (92 lines)

**Flow:**
```
Master Database row
      ↓
calculateQuantumMetrics(parsed)      → ROI, MAO, scores, distance, condition
      ↓
prepareQuantumContext(dealData, metrics) → structured context object
      ↓
executeQuantumAnalysis(context, apiKey, depth) → OpenAI GPT-4 call
      ↓
updateQuantumResults(sheet, rowNum, analysis) → write verdicts to DB
      ↓
logQuantumVerdict(verdictSheet, dealId, analysis) → write to Verdict sheet
      ↓
checkQuantumAlerts(dealData, analysis) → trigger alerts if hot
      ↓
createFollowUpSequence(dealId, 'HOT_LEAD') → auto-engage if enabled
```

---

### B) OpenAI Integration

**File:** quantum_ai.gs

#### API Configuration

| Setting | Value |
|---------|-------|
| Endpoint | `https://api.openai.com/v1/chat/completions` |
| Model (QUANTUM) | gpt-4-turbo-preview |
| Model (ADVANCED) | gpt-4 |
| Temperature | 0.3 (deterministic) |
| Max Tokens | 1000 |
| Response Format | JSON object |

#### System Prompt
> "You are a quantum-class vehicle investment analyst with deep market knowledge and predictive capabilities. Analyze deals with extreme precision and provide actionable intelligence."

#### Analysis Depth Levels

| Level | Prompt Enhancement |
|-------|-------------------|
| QUANTUM | "Ultra-deep analysis considering market microtrends, seasonal patterns, demographic targeting, psychological pricing" |
| ADVANCED | "Profit optimization, risk mitigation, market timing focus" |
| BASIC | "Quick assessment of obvious profit potential and major risks" |

#### Context Object Sent to AI

```javascript
{
  vehicle: {
    year, make, model, trim, mileage, color, title
  },
  pricing: {
    askingPrice, marketValue, mao, estimatedRepairCost
  },
  condition: {
    stated,           // e.g. "Good"
    score,            // 0-100
    repairKeywords,   // matched repair items
    repairRisk        // severity score
  },
  market: {
    daysListed, platform, location, distance,
    competitionLevel, salesVelocity, marketAdvantage
  },
  seller: {
    type,             // Private | Dealer
    hotSeller,        // boolean
    multipleVehicles, // boolean
    engagementScore   // 0-100
  }
}
```

#### AI Response JSON Schema

```javascript
{
  quantumScore: 0-100,
  verdict: "🔥 HOT DEAL | ✅ SOLID DEAL | ⚠️ PORTFOLIO FOUNDATION | ❌ PASS",
  confidence: 0-100,
  flipStrategy: "Quick Flip | Repair + Resell | Wholesale | Part Out | Pass",
  profitPotential: number,
  riskAssessment: {
    overall: "Low | Medium | High",
    factors: ["string"]
  },
  marketTiming: "Excellent | Good | Fair | Poor",
  priceOptimization: {
    suggestedOffer: number,
    maxOffer: number,
    negotiationRoom: number (%)
  },
  quickSaleProbability: 0-100,
  repairComplexity: "None | Simple | Moderate | Complex",
  hiddenCostRisk: 0-100,
  flipTimeline: "X-Y days",
  successProbability: 0-100,
  keyInsights: ["string"],
  redFlags: ["string"],
  greenLights: ["string"],
  sellerMessage: "string",
  recommended: boolean
}
```

#### Verdict Writeback to Master Database

| DB Column | AI Field | Notes |
|-----------|----------|-------|
| 29 (Flip Strategy) | flipStrategy | Quick Flip, Repair + Resell, etc. |
| 37 (Deal Flag) | verdict emoji | 🔥, ✅, ⚠️, ❌ |
| 40 (Seller Message) | sellerMessage | Auto-generated outreach text |
| 41 (AI Confidence) | confidence | 0-100 |
| 42 (Verdict) | verdict | Full verdict string |
| 43 (Verdict Icon) | verdict icon | Emoji only |
| 44 (Recommended) | recommended | YES / NO |

#### Verdict Row Colors

| Verdict | Background Color |
|---------|-----------------|
| 🔥 HOT DEAL | #ffebee (light red) |
| ✅ SOLID DEAL | #e8f5e9 (light green) |
| ❌ PASS | #f5f5f5 (light grey) |

#### Auto-Follow-Up Trigger

When `verdict = "🔥 HOT DEAL"` AND `AUTO_FOLLOW_UP = "true"`:
- Automatically calls `createFollowUpSequence(dealId, 'HOT_LEAD')`

---

### C) Batch Analysis

**Function:** `executeQuantumAIBatch()`

- Reads all rows in Master Database
- Filters to unanalyzed deals (verdict column empty)
- Processes each deal through full pipeline
- Shows processing dialog with progress
- Returns `{ success, message, analyzed, duration }`
- Logs completion to Activity Logs

---

### D) Fallback Analysis

**File:** quantum_fallback.gs

When OpenAI fails (network error, quota exceeded, etc.), `generateFallbackAnalysis()` returns safe defaults:

```javascript
{
  score: 50,                    // Neutral
  verdict: 'PORTFOLIO FOUNDATION',
  confidence: 0,                // Signals AI failure
  flipStrategy: 'Needs Review', // Escalation flag
  sellerMessage: 'Thank you for your listing. We are currently reviewing
                  this vehicle and will follow up with more details shortly.',
  context: context || {}        // Preserves original for debugging
}
```

---

### E) Calculation Engine

**File:** quantum_calculations.gs (371 lines)

#### Master Function: `calculateQuantumMetrics(parsed)`

Returns a metrics object with all computed values for a deal.

#### Distance Calculation

```javascript
// calculateQuantumDistance(targetZip)
distance = Math.abs(homeZip - targetZip) * 0.1  // approximate miles
```

#### Location Risk Assessment

| Distance | Risk | Flag | Score |
|----------|------|------|-------|
| < 25 mi | Low | 🟢 | 90 |
| 25-75 mi | Moderate | 🟡 | 60 |
| > 75 mi | High | 🔴 | 30 |

#### Condition Scoring

| Condition | Score |
|-----------|-------|
| Excellent | 95 |
| Very Good | 85 |
| Good | 75 |
| Fair | 60 |
| Poor | 40 |
| Unknown | 50 |

#### Repair Risk Analysis

`analyzeRepairRisk(repairKeywords)` scans description for keywords:

| Keyword | Severity | Est. Cost |
|---------|----------|-----------|
| transmission | HIGH | $3,000 |
| engine knock | HIGH | $2,500 |
| needs motor | CRITICAL | $4,000 |
| blown head | HIGH | $1,500 |
| no reverse | MEDIUM | $2,000 |
| overheating | MEDIUM | $800 |
| ac broken | LOW | $500 |
| minor dents | LOW | $300 |

Returns `{ score, totalCost }` -- score is sum of severity weights.

#### Market Value Estimation

`estimateQuantumMarketValue(parsed)` -- 4-layer calculation:

**Layer 1 -- Base Value by Age:**

| Vehicle Age | Base Value |
|-------------|-----------|
| 0-2 years | $40,000 |
| 2-4 years | $30,000 |
| 4-6 years | $22,000 |
| 6-10 years | $15,000 |
| 10-15 years | $8,000 |
| 15+ years | $4,000 |

**Layer 2 -- Make Premium Multipliers:**

| Make | Multiplier | | Make | Multiplier |
|------|-----------|---|------|-----------|
| Porsche | 1.50x | | Toyota | 1.10x |
| Tesla | 1.40x | | Honda | 1.08x |
| Lexus | 1.30x | | Ford | 0.95x |
| Mercedes | 1.28x | | Chevrolet | 0.93x |
| BMW | 1.25x | | Nissan | 0.92x |
| Audi | 1.22x | | | |

**Layer 3 -- Mileage Adjustment:**

Expected mileage = age x 12,000 miles/year

| Deviation | Multiplier |
|-----------|-----------|
| > 20K over expected | 0.85x |
| 10-20K over | 0.92x |
| 10-20K under | 1.08x |
| > 20K under | 1.15x |

**Layer 4 -- Condition Multiplier:**

| Condition | Multiplier |
|-----------|-----------|
| Excellent | 1.15x |
| Very Good | 1.08x |
| Good | 1.00x |
| Fair | 0.85x |
| Poor | 0.65x |

**Knowledge Base Adjustment:**
- Very High demand: +10%
- High demand: +5%
- Low demand: -5%
- Capped within knowledge base price range

#### MAO (Maximum Allowable Offer)

```
MAO = (Market Value × 0.75) - Repair Costs - $500 Holding - (Market Value × 0.15 Profit)
Minimum: $500
```

#### Capital Tier Classification

| Tier | Price Range | Multiplier |
|------|-------------|-----------|
| MICRO | $0 - $1,000 | 2.5x |
| BUDGET | $1,000 - $4,000 | 2.0x |
| STANDARD | $4,000 - $10,000 | 1.5x |
| DEALER | $10,000+ | 1.2x |

#### Sales Velocity Scoring (0-100)

Base scores for popular models:
- F-150: 92, Camry: 90, Accord: 88, RAV4: 87
- Civic: 85, CR-V: 84, Silverado: 80, Wrangler: 78

Adjustments:
- +10 for Excellent/Very Good condition
- -15 if listed > 30 days
- +10 if listed < 7 days
- Knowledge base override if available

#### Market Advantage Score (0-100)

Base: 50 points

| Factor | Adjustment |
|--------|-----------|
| Price < 70% of market | +20 |
| Price < 80% of market | +10 |
| Price > 95% of market | -20 |
| Distance < 25 miles | +10 |
| Distance > 100 miles | -15 |
| Condition score > 80 | +15 |
| Condition score < 50 | -15 |
| Facebook | +5 |
| OfferUp | +3 |
| Craigslist | 0 |
| eBay | -5 |

#### Image Scoring

| Image Count | Score |
|-------------|-------|
| 15+ | 95 |
| 10-14 | 85 |
| 7-9 | 75 |
| 5-6 | 65 |
| 3-4 | 50 |
| 1-2 | 30 |
| 0 | 10 |

#### Engagement Score (0-100)

Base: 50

| Factor | Adjustment |
|--------|-----------|
| Listed < 3 days | +20 |
| Listed < 7 days | +10 |
| Listed > 30 days | -20 |
| Private seller | +10 |
| Has phone | +15 |
| Has email | +10 |
| Multiple vehicles | -15 |

#### Competition Level by Platform

| Platform | Base Score |
|----------|----------|
| eBay | 80 (national) |
| Facebook | 60 (regional) |
| OfferUp | 50 (local/regional) |
| Craigslist | 40 (local) |

- Popular models: +15
- Price < $5,000: +10
- Price > $20,000: -10

#### Profit Calculation

```
Profit = Market Value - Asking Price - Repair Cost - $500 Holding
Profit Margin % = (Profit / Market Value) × 100
ROI % = (Profit / (Asking Price + Repair Cost + $500)) × 100
```

#### Priority Classification

```
Score = (ROI × 0.30) + (Profit Margin × 0.20) + (Sales Velocity × 0.20)
      + (Market Advantage × 0.15) + ((100 - Repair Risk) × 0.15)

High:   > 70
Medium: 40-70
Low:    < 40
```

---

### F) Knowledge Base

**File:** quantum_knowledge_base.gs (65 lines)

Pre-loaded vehicle profiles for data-driven analysis:

| Make | Model | Years | Common Issues | Flip Score | Avg Days | Demand |
|------|-------|-------|---------------|-----------|----------|--------|
| Honda | Civic | 2016-2020 | AC Compressor ($1,200) | 85 | 12 | Very High |
| Toyota | Camry | 2015-2020 | None common | 90 | 10 | Very High |
| Honda | Accord | 2016-2020 | Turbo issues ($1,500) | 88 | 14 | High |
| Ford | F-150 | 2015-2020 | Cam phasers ($2,000) | 82 | 18 | Very High |
| Chevrolet | Silverado | 2014-2019 | AFM issues | 80 | 20 | High |
| Toyota | RAV4 | 2016-2020 | None common | 88 | 11 | Very High |
| Honda | CR-V | 2016-2020 | Oil dilution ($750) | 86 | 13 | High |
| Nissan | Altima | 2015-2020 | CVT failure ($4,000) | 65 | 25 | Medium |
| Mazda | CX-5 | 2016-2020 | None common | 84 | 15 | High |
| Jeep | Wrangler | 2015-2020 | Death wobble | 78 | 22 | High |

Each entry also includes: price range (low/high), best selling months, target buyer, negotiation tips, red flags, and success rate.

---

### G) Hot Seller Detection

**File:** quantum_utilities.gs

`detectHotSeller(data)` flags sellers with urgency signals:

**Keywords:** must go, moving, asap, today, quick sale, obo, need gone

Returns `true` if posted within 24 hours OR contains urgency keyword.

`detectMultipleVehicles(description)` flags dealers:

**Keywords:** other vehicles, also have, check my other, more cars, inventory, dealer, lot

---

### H) Platform Detection

`detectPlatform(url)` identifies source from URL:

| URL Contains | Platform |
|-------------|----------|
| facebook.com | Facebook |
| craigslist.org | Craigslist |
| offerup.com | OfferUp |
| ebay.com | eBay |
| (other) | Unknown |

Advanced detection via `detectPlatformFromURLAdvanced()` supports 10+ platforms using ROBOT_REGISTRY URL patterns.

---

### I) Make Standardization

`standardizeMake(make)` normalizes abbreviations:

| Input | Output |
|-------|--------|
| Chevy | Chevrolet |
| VW | Volkswagen |
