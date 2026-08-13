# CarHawk Ultimate -- Browse.AI & Import Pipeline
## Spec Pack Part 5 of 8 | QUANTUM-2.0.0

---

### A) Architecture Overview

**Source Files:** quantum_browse_ai.gs (421 lines), quantum_browse_ai_api.gs (979 lines), quantum_robots.gs (1584 lines), quantum_import.gs (604 lines)

**Total: 3,588 lines** -- the largest subsystem in the platform.

**Import Flow:**
```
Browse.AI Robot (cloud)
      ↓ scrapes marketplace
Export Sheet (Google Sheet shared by Browse.AI)
      ↓
importFromBrowseAI()
      ↓
processBrowseAIIntegration()
      ↓ platform-aware column mapping
mapBrowseAIColumnsPlatform() + resolveField()
      ↓ platform-specific extras
extractPlatformExtras() + buildEnhancedDescription()
      ↓
Master Import Sheet (19 columns, raw data)
      ↓
quantumImportSync() (quantum_import.gs)
      ↓ parse, enrich, score
Master Database Sheet (61 columns, enriched)
```

**API Direct Flow (Alternative):**
```
Browse.AI v2 API
      ↓
runBrowseAITask() or runBrowseAIBulkRun()
      ↓
Browse.AI processes URLs in cloud
      ↓
doPost() webhook callback
      ↓
importWebhookData()
      ↓
Master Import Sheet
```

---

### B) Supported Platforms

#### Automotive (6 platforms)

| Platform | URL Patterns | Seller Detection | Extra Fields | Pagination |
|----------|-------------|------------------|-------------|-----------|
| Facebook Marketplace | facebook.com/marketplace, fb.com/marketplace | dealer/private keywords | -- | Infinite scroll |
| Craigslist | {city}.craigslist.org | dealer/private keywords | cylinders, modelSpecific | Click-next |
| OfferUp | offerup.com | dealer/private keywords | sellerRating, sellerJoined | Standard |
| eBay Motors | ebay.com (cat 6001) | dealer/private keywords | bidCount, watchers, endDate, listingType, sellerFeedback, shippingCost | Standard |
| AutoTrader | autotrader.com | dealer/private keywords | trim, mpg, features, accidents, owners, dealerRating, certifiedPreOwned, priceHistory | Standard |
| Cars.com | cars.com | dealer/private keywords | trim, features, dealValue, accidents, owners, dealerRating, homeDelivery | Standard |

#### Powersports (4 platforms)

| Platform | URL Patterns | Extra Fields |
|----------|-------------|-------------|
| ATV Trader | atvtrader.com | hours, engineSize, vehicleType, features |
| Cycle Trader | cycletrader.com | hours, engineSize |
| Tractor House | tractorhouse.com | hours, engineSize, vehicleType, features, serialNumber |
| Craigslist ATVs/Motorcycles | craigslist.org/ata, /mca | cylinders, modelSpecific |

---

### C) Robot Registry (ROBOT_REGISTRY)

**File:** quantum_robots.gs (1584 lines)

Each platform entry contains:

```javascript
{
  platform: 'Facebook',
  displayName: 'Facebook Marketplace',
  category: 'automotive',
  urlPatterns: [/regex1/, /regex2/, ...],
  searchConfig: {
    baseUrl: 'https://...',
    locationFormat: 'city-state',
    defaultRadius: 100,
    defaultMinPrice: 500,
    defaultMaxPrice: 25000,
    defaultMinYear: 2010,
    sortBy: 'creation_time_descend',
    refreshInterval: 60,      // minutes
    maxPages: 5,
    searchKeywords: ['cars', 'trucks', ...]
  },
  columnMap: {
    url:   ['url', 'link', 'listing_url', 'ad_url', ...],
    title: ['title', 'name', 'listing_title', 'vehicle', ...],
    price: ['price', 'asking_price', 'cost', ...],
    // 15-20+ fields, each with multiple header variants
  },
  fieldDefaults: {
    images: 0,
    condition: 'Unknown',
    sellerType: 'Unknown'
  },
  sellerDetection: {
    dealerKeywords: ['dealership', 'dealer', 'auto sales', ...],
    privateKeywords: ['private seller', 'my car', 'selling my', ...]
  },
  listingIdPattern: /regex/,
  trainingGuide: {
    startUrl: 'https://...',
    robotType: 'List + Detail',
    steps: ['Step 1: ...', 'Step 2: ...'],
    fieldTraining: { title: 'CSS selector hint', ... },
    paginationMethod: 'Infinite Scroll | Click Next',
    importantNotes: ['Note 1', 'Note 2']
  }
}
```

#### Craigslist Regional Support

9 subdomains configured:
- stlouis, kansascity, springfieldmo, columbiamo
- chicago, indianapolis, memphis, nashville, louisville

Categories: cta (all), cto (by owner), ctd (by dealer), ata (ATVs), mca (motorcycles), rva (RVs)

#### Column Map Field Variants

Each field has 5-20 header name variants to handle different Browse.AI export formats:

| Field | Example Variants |
|-------|-----------------|
| url | url, link, listing_url, ad_url, marketplace_url, facebook_url, fb_link |
| title | title, name, listing_title, vehicle, vehicle_title, listing_name |
| price | price, asking_price, cost, listed_price, amount |
| mileage | mileage, miles, odometer, km, vehicle_mileage |
| condition | condition, vehicle_condition, item_condition |
| vin | vin, vin_number, vehicle_vin |

---

### D) Robot Registration & Management

**Two registration methods:**

#### Method 1: Sheet-Based (Legacy)
- Browse.AI exports data to a shared Google Sheet
- User registers the sheet ID + platform via `registerRobotUI()`
- System reads from export sheet during import
- Stored in Integrations sheet

#### Method 2: API-Based (Preferred)
- User provides Browse.AI API key via `setBrowseAIApiKeyUI()`
- Links robots from API via `linkBrowseAIRobotUI()`
- System deploys robots with bulk URLs and webhooks
- Tasks run in Browse.AI cloud, results fetched via API or webhook

#### Registration Functions

| Function | Purpose |
|----------|---------|
| `registerBrowseAIRobot(platform, sheetId, robotName)` | Register sheet-based robot |
| `registerRobotUI()` | Interactive setup wizard |
| `linkBrowseAIRobotUI()` | API-based robot linking wizard |
| `showRobotSetupGuide()` | Display training instructions |
| `showRobotStatusUI()` | Show all registered robots and status |
| `listRegisteredRobots()` | Return robot list from Integrations sheet |
| `getSupportedPlatforms()` | Return categorized platform list |

---

### E) Browse.AI v2 API Integration

**File:** quantum_browse_ai_api.gs (979 lines)

#### API Configuration

```javascript
const BROWSE_AI_API = {
  BASE_URL: 'https://api.browse.ai/v2',
  ENDPOINTS: {
    ROBOTS:   '/robots',
    TASKS:    '/robots/{robotId}/tasks',
    TASK:     '/robots/{robotId}/tasks/{taskId}',
    BULK_RUN: '/robots/{robotId}/bulk-runs',
    WEBHOOKS: '/robots/{robotId}/webhooks'
  }
}
```

Authentication: Bearer token (API key stored in script properties)

#### Core API Functions

| Function | Method | Purpose |
|----------|--------|---------|
| `browseAIRequest(method, endpoint, payload)` | * | Core HTTP client with auth |
| `listBrowseAIRobots()` | GET | List all robots in account |
| `getBrowseAIRobot(robotId)` | GET | Get specific robot details |
| `runBrowseAITask(robotId, url, params)` | POST | Run single scrape task |
| `getBrowseAITask(robotId, taskId)` | GET | Get task status/results |
| `listBrowseAITasks(robotId, options)` | GET | List tasks with filters |
| `runBrowseAIBulkRun(robotId, urls, title)` | POST | Run bulk scrape (1000 max per batch) |
| `registerBrowseAIWebhook(robotId, url, event)` | POST | Register completion webhook |

#### Bulk Run Batching

`runBrowseAIBulkRun()` splits URL lists into chunks of 1000:
- Each batch sent as separate API call
- 1-second pause between batches to avoid rate limits
- Returns array of bulk run IDs

#### Webhook Receiver

`doPost(e)` -- Google Apps Script web app endpoint:
1. Receives POST from Browse.AI on task completion
2. Extracts robotId, taskId, capturedTexts
3. Calls `importWebhookData()` to write to Master Import

---

### F) Search URL Builders

Generate marketplace search URLs for bulk robot deployment:

#### buildFacebookMarketplaceURLs(params)
- Builds paginated Facebook search URLs
- Filters: minPrice, maxPrice, minYear, radius
- Returns array of URLs

#### buildCraigslistURLs(params)
- Builds across multiple regional subdomains
- Supports categories: cta, cto, ctd, ata, mca
- Multiple regions per call

#### buildOfferUpURLs(params)
- Category 7 (Vehicles)
- ZIP-based with radius filter

#### buildEbayMotorsURLs(params)
- Category 6001 (Cars & Trucks)
- Separate URLs for Buy It Now and Auction

#### buildAutoTraderURLs(params)
- Used vehicles filter
- Pagination support

#### buildCarsComURLs(params)
- Used stock filter
- Pagination support

#### buildATVTraderURLs(params) / buildCycleTraderURLs(params)
- Price and radius filters
- Pagination support

#### buildCraigslistATVURLs(params)
- ATVs/UTVs/Snowmobiles and Motorcycles/Scooters categories

---

### G) Robot Deployment

#### Single Platform Deploy

`deployMarketplaceRobot(platform, robotId, searchParams)`:
1. Generates search URLs via appropriate builder
2. Runs bulk scrape via `runBrowseAIBulkRun()`
3. Registers webhook for completion notifications
4. Returns `{ platform, robotId, urlCount, bulkRuns }`

#### Deploy All

`deployAllRobots(searchParams)`:
- Iterates all registered robots in Integrations sheet
- Deploys each one via `deployMarketplaceRobot()`

---

### H) Import Processing (Sheet-Based)

**File:** quantum_browse_ai.gs (421 lines)

#### `importFromBrowseAI()` -- Main Entry Point

1. Fetches all active Browse.AI integrations from Integrations sheet
2. For each integration:
   - Opens the export sheet by ID
   - Reads all data rows
   - Maps columns based on platform via `mapBrowseAIColumnsPlatform()`
   - For each row:
     - Skips if URL already processed (deduplication via script properties)
     - Resolves fields using `resolveField()` (primary + fallbacks)
     - Extracts platform-specific extras
     - Builds enhanced description with [TAG: value] annotations
     - Builds enhanced seller info with type detection
     - Appends row to Master Import sheet
     - Marks URL as processed
3. Updates integration sync status
4. Shows summary alert

#### Platform-Specific Extras

`extractPlatformExtras()` extracts fields unique to each platform:

| Platform | Extra Fields |
|----------|-------------|
| eBay | bidCount, watchers, endDate, listingType, sellerFeedback, shippingCost |
| AutoTrader | trim, mpg, features, accidents, owners, dealerRating, certifiedPreOwned, priceHistory |
| Cars.com | trim, features, dealValue, accidents, owners, dealerRating, homeDelivery |
| OfferUp | sellerRating, sellerJoined |
| Craigslist | cylinders, modelSpecific |
| Powersports | hours, engineSize, vehicleType, features, serialNumber |

#### Enhanced Description Tags

`buildEnhancedDescription()` embeds structured data:
```
[Original description text]
[MILEAGE: 45000]
[VIN: 1HGCV1F34LA000001]
[CONDITION: Good]
[TRANSMISSION: Automatic]
[FUEL_TYPE: Gasoline]
[BODY_STYLE: Sedan]
[EXTERIOR_COLOR: Silver]
[DRIVETRAIN: FWD]
[TITLE_STATUS: Clean]
```

#### URL Deduplication

- `getProcessedUrls()` reads from PropertiesService (max 1000 URLs)
- `markUrlProcessed(url)` adds to stored list
- Prevents re-importing same listings

---

### I) Import Sync to Master Database

**File:** quantum_import.gs (604 lines)

`quantumImportSync()` -- Processes Master Import rows into Master Database:

1. Reads unprocessed rows from Master Import (Processed = false)
2. For each row:
   - Parses raw fields (title → year/make/model, price → number, etc.)
   - Calls `calculateQuantumMetrics(parsed)` for all scoring
   - Generates Deal ID
   - Writes 61-column row to Master Database
   - Calls `addToLeadsTracker()` to create lead entry
   - Marks import row as processed (col 16 = true, col 17 = Deal ID)
3. Shows processing dialog with count

---

### J) Seller Type Detection

**File:** quantum_robots.gs

`detectSellerType(sellerInfo, description, platform)`:

**Dealer Keywords:** dealership, dealer, auto sales, motors, automotive, car lot, pre-owned, certified, inventory, financing available, we finance, buy here pay here, bhph

**Private Keywords:** private seller, private owner, personal vehicle, my car, selling my, owner, one owner, clean title

Returns: 'Dealer', 'Private', or 'Unknown'

---

### K) UI Functions for Browse.AI

| Function | UI Type | Purpose |
|----------|---------|---------|
| `setBrowseAIApiKeyUI()` | Prompt | Enter API key (stored in script properties) |
| `showBrowseAIRobotsUI()` | Dialog | List all robots from API |
| `linkBrowseAIRobotUI()` | Wizard | Link API robot to platform |
| `registerRobotUI()` | Wizard | Register sheet-based robot |
| `showRobotSetupGuide()` | Modal | Display training instructions |
| `deployRobotUI()` | Wizard | Deploy robot(s) with URL generation |
| `fetchAndImportBrowseAIDataUI()` | Alert | Fetch API task results |
| `showRobotStatusUI()` | Modal | All robots and platforms status |
