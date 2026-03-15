// =========================================================
// FILE: quantum_robots.gs - Browse.AI Robot Configurations
// =========================================================
// Platform-specific robot definitions for each marketplace.
// Each robot config defines: field mappings, URL patterns,
// search parameters, extraction selectors, and data normalization.
// =========================================================

/**
 * ROBOT_REGISTRY - Master configuration for all Browse.ai robots.
 * Each entry defines how to scrape and normalize data from a specific marketplace.
 *
 * Structure per robot:
 *   platform      - Internal platform identifier
 *   displayName   - Human-readable name
 *   category      - 'automotive' or 'powersports'
 *   urlPatterns   - Regex patterns to identify this platform from URLs
 *   searchConfig  - Default search parameters for robot setup
 *   columnMap     - Platform-specific header variants Browse.ai may export
 *   fieldDefaults - Fallback values when fields are missing
 *   normalizers   - Functions to clean/transform raw extracted data
 *   sellerDetection - Keywords to identify dealer vs private seller
 *   listingIdPattern - Regex to extract unique listing ID from URL
 */
const ROBOT_REGISTRY = {

  // =======================================================
  // AUTOMOTIVE MARKETPLACES
  // =======================================================

  FACEBOOK: {
    platform: 'Facebook',
    displayName: 'Facebook Marketplace',
    category: 'automotive',
    urlPatterns: [
      /facebook\.com\/marketplace/i,
      /fb\.com\/marketplace/i,
      /facebook\.com\/groups\/.+\/permalink/i
    ],
    searchConfig: {
      baseUrl: 'https://www.facebook.com/marketplace/{location}/vehicles',
      locationFormat: 'city-state', // e.g., "st-louis-missouri"
      defaultRadius: 60, // miles
      defaultMinPrice: 500,
      defaultMaxPrice: 15000,
      defaultMinYear: 2005,
      sortBy: 'date_listed_newest',
      refreshInterval: 30, // minutes
      maxPages: 10,
      searchKeywords: [
        'car for sale', 'truck for sale', 'suv for sale',
        'cash only', 'needs gone', 'must sell', 'obo'
      ]
    },
    columnMap: {
      url: ['url', 'link', 'listing_url', 'ad_url', 'marketplace_url', 'facebook_url', 'fb_link'],
      title: ['title', 'name', 'listing_title', 'vehicle', 'vehicle_title', 'listing_name'],
      price: ['price', 'asking_price', 'cost', 'listed_price', 'amount'],
      location: ['location', 'city', 'area', 'listed_in', 'marketplace_location', 'seller_location'],
      description: ['description', 'details', 'info', 'listing_description', 'about', 'vehicle_details'],
      sellerInfo: ['seller', 'contact', 'seller_name', 'listed_by', 'seller_profile', 'owner'],
      postedDate: ['date', 'posted', 'listed_date', 'date_listed', 'listed_on', 'posted_date'],
      images: ['images', 'photos', 'image_count', 'photo_count', 'number_of_photos'],
      mileage: ['mileage', 'miles', 'odometer', 'km', 'vehicle_mileage'],
      condition: ['condition', 'vehicle_condition', 'item_condition'],
      vin: ['vin', 'vin_number', 'vehicle_vin'],
      transmission: ['transmission', 'trans', 'gearbox'],
      fuelType: ['fuel', 'fuel_type', 'gas_type'],
      bodyStyle: ['body_style', 'body_type', 'type', 'vehicle_type'],
      exteriorColor: ['color', 'exterior_color', 'ext_color'],
      drivetrain: ['drivetrain', 'drive', 'drive_type', 'awd', '4wd', 'fwd'],
      titleStatus: ['title_status', 'title_type', 'clean_title', 'salvage'],
      sellerType: ['seller_type', 'dealer_or_private'],
      jobLink: ['job_link', 'browse_ai_link', 'task_link']
    },
    fieldDefaults: {
      images: 0,
      condition: 'Unknown',
      sellerType: 'Private'
    },
    sellerDetection: {
      dealerKeywords: [
        'dealership', 'dealer', 'auto sales', 'motors', 'automotive',
        'car lot', 'pre-owned', 'certified', 'inventory', 'financing available',
        'we finance', 'buy here pay here', 'bhph'
      ],
      privateKeywords: [
        'private seller', 'private owner', 'personal vehicle', 'my car',
        'selling my', 'owner', 'one owner', 'clean title'
      ]
    },
    listingIdPattern: /\/item\/(\d+)/,
    trainingGuide: {
      startUrl: 'https://www.facebook.com/marketplace/stlouis/vehicles?minPrice=500&maxPrice=15000&minYear=2005&daysSinceListed=7&sortBy=creation_time_descend',
      robotType: 'Extract data from a list of elements on a page',
      steps: [
        'Navigate to Facebook Marketplace > Vehicles with your desired filters',
        'When Browse.ai asks "What data do you want to extract?", choose "Data from a list"',
        'Click the FIRST listing card in the search results grid',
        'Browse.ai will auto-detect the repeating pattern — confirm it highlights all listing cards',
        'For each highlighted card, label the extracted fields (see field names below)',
        'Click into a single listing to train detail-page fields (description, VIN, seller info)',
        'Set pagination: Facebook uses infinite scroll — set "Scroll to load more" with max 10 scrolls'
      ],
      fieldTraining: {
        title:       'Click the listing title text (e.g. "2015 Honda Civic LX"). Name it: title',
        price:       'Click the price text (e.g. "$8,500"). Name it: price',
        location:    'Click the location/city text below the price. Name it: location',
        url:         'The listing link is auto-captured. Name it: url',
        images:      'On the detail page, count the photo thumbnails or grab the main image. Name it: images',
        mileage:     'On the detail page, find "Mileage" or "Miles" in the vehicle details section. Name it: mileage',
        description: 'On the detail page, click the "Description" or "Seller\'s description" block. Name it: description',
        condition:   'On the detail page, find "Condition" in the details grid. Name it: condition',
        sellerInfo:  'On the detail page, click the seller name/profile link. Name it: seller',
        postedDate:  'On the detail page or card, click the "Listed X days/hours ago" text. Name it: posted',
        transmission:'On the detail page, find "Transmission" in the details grid. Name it: transmission',
        fuelType:    'On the detail page, find "Fuel type" in the details grid. Name it: fuel_type',
        bodyStyle:   'On the detail page, find "Body style" in the details grid. Name it: body_style',
        exteriorColor:'On the detail page, find "Exterior color" in the details grid. Name it: color',
        vin:         'On the detail page, look for VIN near the bottom of vehicle details. Name it: vin',
        titleStatus: 'On the detail page, find "Clean title" badge if present. Name it: title_status'
      },
      paginationMethod: 'infinite_scroll',
      paginationNotes: 'Set scroll count to 8-10. Each scroll loads ~8 more listings. Facebook may require login for full results.',
      importantNotes: [
        'Facebook may block scraping if too frequent — set monitor to 30+ minute intervals',
        'You MUST be logged into Facebook for the robot to see vehicle details',
        'Use a "Prerun action" to dismiss any pop-ups (cookie consent, login prompts)',
        'If listings show "See More" for descriptions, add a click action to expand them'
      ]
    }
  },

  CRAIGSLIST: {
    platform: 'Craigslist',
    displayName: 'Craigslist',
    category: 'automotive',
    urlPatterns: [
      /craigslist\.org/i,
      /\.craigslist\./i
    ],
    searchConfig: {
      baseUrl: 'https://{subdomain}.craigslist.org/search/cta',
      locationFormat: 'subdomain', // e.g., "stlouis" → stlouis.craigslist.org
      subdomains: {
        'St. Louis': 'stlouis',
        'Kansas City': 'kansascity',
        'Springfield MO': 'springfieldmo',
        'Columbia MO': 'columbiamo',
        'Chicago': 'chicago',
        'Indianapolis': 'indianapolis',
        'Memphis': 'memphis',
        'Nashville': 'nashville',
        'Louisville': 'louisville'
      },
      defaultRadius: 100, // miles
      defaultMinPrice: 500,
      defaultMaxPrice: 15000,
      defaultMinYear: 2005,
      sortBy: 'date',
      refreshInterval: 15, // minutes - CL moves fast
      maxPages: 5,
      categories: {
        cars: 'cta',      // cars+trucks - all
        cto: 'cto',       // cars+trucks - by owner
        ctd: 'ctd',       // cars+trucks - by dealer
        ata: 'ata',       // atvs/utvs/snowmobiles
        mca: 'mca',       // motorcycles/scooters
        rva: 'rva'        // recreational vehicles
      },
      searchKeywords: [
        'runs drives', 'cash only', 'obo', 'must sell',
        'moving sale', 'clean title', 'no issues'
      ]
    },
    columnMap: {
      url: ['url', 'link', 'listing_url', 'post_url', 'cl_link', 'craigslist_url'],
      title: ['title', 'name', 'listing_title', 'posting_title', 'post_title'],
      price: ['price', 'asking_price', 'cost', 'listed_price'],
      location: ['location', 'city', 'area', 'neighborhood', 'region', 'post_location'],
      description: ['description', 'details', 'info', 'body', 'posting_body', 'post_body'],
      sellerInfo: ['seller', 'contact', 'reply_email', 'phone', 'contact_info'],
      postedDate: ['date', 'posted', 'listed_date', 'post_date', 'posting_date', 'datetime'],
      images: ['images', 'photos', 'image_count', 'photo_count', 'num_images'],
      mileage: ['mileage', 'miles', 'odometer'],
      condition: ['condition', 'vehicle_condition'],
      vin: ['vin', 'vin_number'],
      transmission: ['transmission', 'trans'],
      fuelType: ['fuel', 'fuel_type'],
      bodyStyle: ['body_style', 'body_type', 'type'],
      exteriorColor: ['color', 'paint_color', 'exterior_color'],
      drivetrain: ['drivetrain', 'drive'],
      titleStatus: ['title_status', 'title', 'clean_title'],
      cylinders: ['cylinders', 'engine_cylinders'],
      modelSpecific: ['model_specific', 'size', 'engine_size'],
      jobLink: ['job_link', 'browse_ai_link']
    },
    fieldDefaults: {
      images: 0,
      condition: 'Unknown',
      sellerType: 'Private'
    },
    sellerDetection: {
      dealerKeywords: [
        'dealer', 'dealership', 'auto sales', 'motors', 'llc',
        'inc', 'financing', 'warranty included', 'we finance'
      ],
      privateKeywords: [
        'by owner', 'private', 'my car', 'personal', 'selling my'
      ]
    },
    listingIdPattern: /\/(\d{10,})\./,
    trainingGuide: {
      startUrl: 'https://stlouis.craigslist.org/search/cto?min_price=500&max_price=15000&min_auto_year=2005&auto_title_status=1&sort=date&purveyor=owner',
      robotType: 'Extract data from a list of elements on a page',
      steps: [
        'Navigate to Craigslist > Cars+Trucks - By Owner with your price/year filters',
        'When Browse.ai asks "What data?", choose "Data from a list"',
        'Click the FIRST listing row in the search results',
        'Browse.ai will auto-detect the repeating list rows — confirm all rows are highlighted',
        'Label each field in the row (title, price, location, date — see below)',
        'Then click into a single listing to train detail-page fields',
        'Set pagination: Click the "next >" button at the bottom of search results'
      ],
      fieldTraining: {
        title:       'Click the listing title link (blue text). Name it: title',
        price:       'Click the price text on the right side of each row. Name it: price',
        location:    'Click the location text in parentheses after the title. Name it: location',
        url:         'The href from the title link is auto-captured. Name it: url',
        postedDate:  'Click the date on the left side of each row. Name it: posted',
        images:      'On the detail page, count image thumbnails or grab the image gallery count. Name it: images',
        mileage:     'On the detail page, find "odometer" in the attributes list. Name it: mileage',
        description: 'On the detail page, click the posting body text block. Name it: description',
        condition:   'On the detail page, find "condition" in the attributes list. Name it: condition',
        vin:         'On the detail page, find "VIN" in the attributes list. Name it: vin',
        transmission:'On the detail page, find "transmission" in attributes. Name it: transmission',
        fuelType:    'On the detail page, find "fuel" in attributes. Name it: fuel_type',
        bodyStyle:   'On the detail page, find "type" in attributes. Name it: body_style',
        exteriorColor:'On the detail page, find "paint color" in attributes. Name it: color',
        drivetrain:  'On the detail page, find "drive" in attributes. Name it: drivetrain',
        titleStatus: 'On the detail page, find "title status" in attributes. Name it: title_status',
        cylinders:   'On the detail page, find "cylinders" in attributes. Name it: cylinders'
      },
      paginationMethod: 'click_next',
      paginationNotes: 'Click the "next >" link at the bottom. Craigslist shows 120 results per page. Set max 5 pages.',
      importantNotes: [
        'Craigslist moves fast — set monitor interval to 15 minutes',
        'Train on "cto" (by owner) category to filter out dealers',
        'Create separate robots for each Craigslist subdomain (stlouis, kansascity, etc.)',
        'Craigslist attributes are key-value pairs on the detail page — click the VALUE, not the label',
        'Some listings lack attributes — Browse.ai will return empty strings, which is fine'
      ]
    }
  },

  OFFERUP: {
    platform: 'OfferUp',
    displayName: 'OfferUp',
    category: 'automotive',
    urlPatterns: [
      /offerup\.com/i,
      /letgo\.com/i // LetGo merged into OfferUp
    ],
    searchConfig: {
      baseUrl: 'https://offerup.com/search/?q={query}&location={location}',
      locationFormat: 'zip', // Uses ZIP code
      defaultRadius: 50, // miles
      defaultMinPrice: 500,
      defaultMaxPrice: 15000,
      defaultMinYear: 2005,
      sortBy: 'posted', // newest first
      refreshInterval: 30, // minutes
      maxPages: 8,
      categoryId: 7, // Vehicles category
      searchKeywords: [
        'car', 'truck', 'suv', 'sedan', 'coupe',
        'clean title', 'runs good', 'obo'
      ]
    },
    columnMap: {
      url: ['url', 'link', 'listing_url', 'offerup_url', 'item_url'],
      title: ['title', 'name', 'listing_title', 'item_title', 'item_name'],
      price: ['price', 'asking_price', 'cost', 'listed_price', 'amount'],
      location: ['location', 'city', 'area', 'posted_in', 'seller_location'],
      description: ['description', 'details', 'info', 'item_description', 'listing_details'],
      sellerInfo: ['seller', 'contact', 'seller_name', 'owner', 'seller_profile'],
      postedDate: ['date', 'posted', 'listed_date', 'posted_date', 'date_posted'],
      images: ['images', 'photos', 'image_count', 'photo_count'],
      mileage: ['mileage', 'miles', 'odometer'],
      condition: ['condition', 'item_condition', 'vehicle_condition'],
      vin: ['vin', 'vin_number'],
      transmission: ['transmission'],
      fuelType: ['fuel', 'fuel_type'],
      bodyStyle: ['body_style', 'body_type', 'vehicle_type'],
      exteriorColor: ['color', 'exterior_color'],
      titleStatus: ['title_status', 'clean_title'],
      sellerRating: ['seller_rating', 'rating', 'stars'],
      sellerJoined: ['member_since', 'joined', 'seller_since'],
      jobLink: ['job_link', 'browse_ai_link']
    },
    fieldDefaults: {
      images: 0,
      condition: 'Unknown',
      sellerType: 'Private'
    },
    sellerDetection: {
      dealerKeywords: [
        'dealer', 'dealership', 'auto sales', 'motors', 'pro seller',
        'truecar certified', 'certified dealer'
      ],
      privateKeywords: [
        'private', 'owner', 'personal', 'my car'
      ]
    },
    listingIdPattern: /\/detail\/(\d+)/,
    trainingGuide: {
      startUrl: 'https://offerup.com/search?q=car&delivery_param=all&sort=-posted&price_min=500&price_max=15000&location=63101&radius=50&category_id=7',
      robotType: 'Extract data from a list of elements on a page',
      steps: [
        'Navigate to OfferUp > Vehicles category with your ZIP, price, and radius filters',
        'When Browse.ai asks "What data?", choose "Data from a list"',
        'Click the FIRST listing card in the grid',
        'Browse.ai auto-detects the card grid — confirm all cards highlight',
        'Label the visible card fields (title, price, location — see below)',
        'Click into a listing to train detail-page fields (description, seller, etc.)',
        'Set pagination: OfferUp uses infinite scroll — set scroll count to 6-8'
      ],
      fieldTraining: {
        title:       'Click the item title on each card. Name it: title',
        price:       'Click the price on each card. Name it: price',
        location:    'Click the location/distance text below the price. Name it: location',
        url:         'Auto-captured from the card link. Name it: url',
        images:      'On the detail page, count photos or grab main image. Name it: images',
        description: 'On the detail page, click the item description text block. Name it: description',
        condition:   'On the detail page, find "Condition" in the details section. Name it: condition',
        sellerInfo:  'On the detail page, click the seller name. Name it: seller',
        sellerRating:'On the detail page, click the seller star rating. Name it: seller_rating',
        sellerJoined:'On the detail page, find "Member since" text. Name it: member_since',
        postedDate:  'On the detail page or card, find the "Posted X days ago" text. Name it: posted'
      },
      paginationMethod: 'infinite_scroll',
      paginationNotes: 'Set scroll count to 6-8. Each scroll loads ~12 more cards.',
      importantNotes: [
        'OfferUp merged with LetGo — same robot works for both',
        'Filter by category_id=7 (Vehicles) in the URL to avoid non-vehicle results',
        'Pro Seller badges indicate dealers — the seller detection logic handles this',
        'OfferUp detail pages load dynamically — add a 2-3 second wait before extraction'
      ]
    }
  },

  EBAY: {
    platform: 'eBay',
    displayName: 'eBay Motors',
    category: 'automotive',
    urlPatterns: [
      /ebay\.com\/motors/i,
      /ebay\.com\/itm/i,
      /ebay\.com\/sch.*motors/i
    ],
    searchConfig: {
      baseUrl: 'https://www.ebay.com/sch/Cars-Trucks/6001/i.html',
      locationFormat: 'zip-radius',
      defaultRadius: 150, // miles - eBay is national so wider radius
      defaultMinPrice: 1000,
      defaultMaxPrice: 20000,
      defaultMinYear: 2005,
      sortBy: 'newly_listed',
      refreshInterval: 60, // minutes
      maxPages: 5,
      listingTypes: ['buy_it_now', 'auction'],
      categories: {
        cars: 6001,
        trucks: 6002,
        suvs: 6003,
        atvs: 6723,
        motorcycles: 6024,
        rvs: 50054,
        boats: 26429,
        powersports: 66466
      },
      searchKeywords: [
        'no reserve', 'buy it now', 'clean title', 'low miles',
        'runs drives', 'project car', 'mechanic special'
      ]
    },
    columnMap: {
      url: ['url', 'link', 'listing_url', 'item_url', 'ebay_url', 'item_link'],
      title: ['title', 'name', 'listing_title', 'item_title', 'vehicle_title'],
      price: ['price', 'asking_price', 'cost', 'buy_it_now_price', 'current_bid', 'bid_price'],
      location: ['location', 'city', 'area', 'item_location', 'seller_location'],
      description: ['description', 'details', 'info', 'item_description', 'listing_description'],
      sellerInfo: ['seller', 'contact', 'seller_name', 'seller_id', 'seller_username'],
      postedDate: ['date', 'posted', 'listed_date', 'start_date', 'listing_date'],
      images: ['images', 'photos', 'image_count', 'photo_count', 'gallery_count'],
      mileage: ['mileage', 'miles', 'odometer', 'vehicle_mileage'],
      condition: ['condition', 'vehicle_condition', 'item_condition'],
      vin: ['vin', 'vin_number', 'vehicle_vin'],
      transmission: ['transmission', 'trans', 'gearbox'],
      fuelType: ['fuel', 'fuel_type', 'engine_fuel'],
      bodyStyle: ['body_style', 'body_type', 'type', 'vehicle_type'],
      exteriorColor: ['color', 'exterior_color', 'ext_color'],
      interiorColor: ['interior_color', 'int_color'],
      drivetrain: ['drivetrain', 'drive', 'drive_type'],
      titleStatus: ['title_status', 'title_type', 'vehicle_title'],
      engine: ['engine', 'engine_size', 'displacement', 'cylinders'],
      bidCount: ['bids', 'bid_count', 'number_of_bids'],
      watchers: ['watchers', 'watching', 'watch_count'],
      endDate: ['end_date', 'auction_end', 'time_left', 'ends'],
      listingType: ['listing_type', 'format', 'buy_it_now', 'auction'],
      sellerFeedback: ['feedback', 'seller_feedback', 'feedback_score', 'seller_rating'],
      returnPolicy: ['returns', 'return_policy'],
      shippingCost: ['shipping', 'shipping_cost', 'delivery_cost'],
      jobLink: ['job_link', 'browse_ai_link']
    },
    fieldDefaults: {
      images: 0,
      condition: 'Used',
      sellerType: 'Unknown',
      bidCount: 0,
      watchers: 0
    },
    sellerDetection: {
      dealerKeywords: [
        'dealer', 'dealership', 'auto sales', 'motors', 'llc',
        'inc', 'powerseller', 'top rated seller', 'business seller'
      ],
      privateKeywords: [
        'private listing', 'private seller', 'personal vehicle'
      ]
    },
    listingIdPattern: /\/itm\/(\d+)/,
    trainingGuide: {
      startUrl: 'https://www.ebay.com/sch/Cars-Trucks/6001/i.html?_udlo=1000&_udhi=20000&_stpos=63101&_sadis=150&LH_ItemCondition=3000&_sop=10&LH_BIN=1',
      robotType: 'Extract data from a list of elements on a page',
      steps: [
        'Navigate to eBay Motors > Cars & Trucks with your filters',
        'When Browse.ai asks "What data?", choose "Data from a list"',
        'Click the FIRST listing in the search results',
        'Browse.ai will highlight all listing cards — confirm the pattern',
        'Label the card-level fields (title, price, location, shipping)',
        'Click into a listing to train detail-page fields (VIN, condition, seller feedback)',
        'Set pagination: Click the "Next" arrow button at the bottom'
      ],
      fieldTraining: {
        title:       'Click the listing title. Name it: title',
        price:       'Click the price (Buy It Now or current bid). Name it: price',
        location:    'Click the item location text. Name it: location',
        url:         'Auto-captured from the listing link. Name it: url',
        images:      'On the detail page, photo gallery count or main image. Name it: images',
        mileage:     'On the detail page, find "Mileage" in the item specifics table. Name it: mileage',
        condition:   'On the detail page, find "Condition" near the top. Name it: condition',
        description: 'On the detail page, click the item description (may be in an iframe). Name it: description',
        sellerInfo:  'On the detail page, click the seller username link. Name it: seller',
        vin:         'On the detail page, find "VIN" in item specifics. Name it: vin',
        transmission:'On the detail page, find "Transmission" in item specifics. Name it: transmission',
        fuelType:    'On the detail page, find "Fuel Type" in item specifics. Name it: fuel_type',
        bodyStyle:   'On the detail page, find "Body Type" in item specifics. Name it: body_style',
        exteriorColor:'On the detail page, find "Exterior Color" in item specifics. Name it: color',
        drivetrain:  'On the detail page, find "Drive Type" in item specifics. Name it: drivetrain',
        engine:      'On the detail page, find "Engine" in item specifics. Name it: engine',
        bidCount:    'On the listing card or detail page, find bid count. Name it: bids',
        watchers:    'On the detail page, find "X watchers" text. Name it: watchers',
        endDate:     'On the detail page, find auction end date/time left. Name it: end_date',
        listingType: 'On the listing card, note "Buy It Now" vs "Auction". Name it: listing_type',
        sellerFeedback:'On the detail page, click the seller feedback score. Name it: feedback',
        shippingCost:'On the listing card, find shipping cost text. Name it: shipping'
      },
      paginationMethod: 'click_next',
      paginationNotes: 'Click the right arrow / "Next" at the bottom of search results. 50-60 results per page.',
      importantNotes: [
        'Create TWO separate robots: one for Buy It Now (LH_BIN=1), one for Auctions (LH_Auction=1)',
        'eBay item specifics are in a structured table — click the VALUE cell, not the label',
        'Description may be in an iframe — you may need a "Navigate to iframe" action in Browse.ai',
        'Set monitor interval to 60 minutes — eBay rate limits aggressive scraping',
        'For auction listings, capture bid_count and end_date for time-sensitive deal scoring'
      ]
    }
  },

  AUTOTRADER: {
    platform: 'AutoTrader',
    displayName: 'AutoTrader',
    category: 'automotive',
    urlPatterns: [
      /autotrader\.com/i,
      /autotraderclassics\.com/i
    ],
    searchConfig: {
      baseUrl: 'https://www.autotrader.com/cars-for-sale/all-cars/{location}',
      locationFormat: 'city-state-zip', // "St+Louis+MO+63101"
      defaultRadius: 75, // miles
      defaultMinPrice: 1000,
      defaultMaxPrice: 20000,
      defaultMinYear: 2005,
      sortBy: 'derivedpriceDESC', // best deal first
      refreshInterval: 60, // minutes
      maxPages: 5,
      listingTypes: ['used', 'certified', 'new'],
      searchKeywords: [
        'used cars', 'certified pre-owned', 'one owner',
        'low mileage', 'no accidents'
      ]
    },
    columnMap: {
      url: ['url', 'link', 'listing_url', 'autotrader_url', 'vehicle_url', 'detail_url'],
      title: ['title', 'name', 'listing_title', 'vehicle_title', 'vehicle_name', 'year_make_model'],
      price: ['price', 'asking_price', 'cost', 'listed_price', 'dealer_price', 'internet_price'],
      location: ['location', 'city', 'area', 'dealer_location', 'dealer_city'],
      description: ['description', 'details', 'info', 'vehicle_description', 'comments', 'seller_notes'],
      sellerInfo: ['seller', 'contact', 'seller_name', 'dealer_name', 'dealership', 'dealer'],
      postedDate: ['date', 'posted', 'listed_date', 'listing_date'],
      images: ['images', 'photos', 'image_count', 'photo_count', 'gallery_count'],
      mileage: ['mileage', 'miles', 'odometer', 'vehicle_mileage'],
      condition: ['condition', 'vehicle_condition'],
      vin: ['vin', 'vin_number', 'vehicle_vin'],
      transmission: ['transmission', 'trans', 'gearbox'],
      fuelType: ['fuel', 'fuel_type', 'engine_fuel', 'mpg_city', 'mpg_highway'],
      bodyStyle: ['body_style', 'body_type', 'type', 'vehicle_type'],
      exteriorColor: ['color', 'exterior_color', 'ext_color'],
      interiorColor: ['interior_color', 'int_color'],
      drivetrain: ['drivetrain', 'drive', 'drive_type'],
      titleStatus: ['title_status', 'title_type'],
      engine: ['engine', 'engine_size', 'displacement'],
      trim: ['trim', 'trim_level', 'package'],
      mpg: ['mpg', 'fuel_economy', 'mpg_combined'],
      features: ['features', 'options', 'equipment', 'highlights'],
      accidents: ['accidents', 'accident_history', 'damage_reported'],
      owners: ['owners', 'owner_count', 'number_of_owners', 'ownership_history'],
      dealerPhone: ['phone', 'dealer_phone', 'contact_phone'],
      dealerRating: ['dealer_rating', 'rating', 'stars', 'review_score'],
      certifiedPreOwned: ['certified', 'cpo', 'certified_pre_owned'],
      priceHistory: ['price_drop', 'price_history', 'price_change', 'days_on_market'],
      jobLink: ['job_link', 'browse_ai_link']
    },
    fieldDefaults: {
      images: 0,
      condition: 'Used',
      sellerType: 'Dealer' // AutoTrader is mostly dealers
    },
    sellerDetection: {
      dealerKeywords: [
        'dealership', 'dealer', 'auto sales', 'motors', 'automotive group',
        'certified', 'franchise', 'cpo'
      ],
      privateKeywords: [
        'private seller', 'for sale by owner', 'fsbo', 'individual'
      ]
    },
    listingIdPattern: /\/(\d{9,})/,
    trainingGuide: {
      startUrl: 'https://www.autotrader.com/cars-for-sale/all-cars?listingTypes=USED&zip=63101&searchRadius=75&startYear=2005&minPrice=1000&maxPrice=20000&sortBy=derivedpriceDESC&numRecords=25',
      robotType: 'Extract data from a list of elements on a page',
      steps: [
        'Navigate to AutoTrader > Used Cars with your ZIP, radius, and price filters',
        'When Browse.ai asks "What data?", choose "Data from a list"',
        'Click the FIRST listing card in the results',
        'Confirm Browse.ai highlights all listing cards on the page',
        'Label the card-level fields (title, price, mileage, dealer name)',
        'Click into a listing to train the detail page (VIN, features, price history)',
        'Set pagination: Click the "Next" or page number buttons at the bottom'
      ],
      fieldTraining: {
        title:       'Click the vehicle title (e.g. "2018 Toyota Camry SE"). Name it: title',
        price:       'Click the price. AutoTrader may show "Internet Price" and "MSRP" — grab the main price. Name it: price',
        location:    'Click the dealer location (city, state). Name it: location',
        url:         'Auto-captured from the card link. Name it: url',
        mileage:     'Click the mileage text on the card (e.g. "45,230 miles"). Name it: mileage',
        sellerInfo:  'Click the dealer name on the card. Name it: seller',
        images:      'On the detail page, grab photo count or gallery. Name it: images',
        description: 'On the detail page, find seller notes / vehicle description. Name it: description',
        condition:   'On the detail page, note "Used" or "Certified Pre-Owned". Name it: condition',
        vin:         'On the detail page, find VIN in the vehicle details section. Name it: vin',
        transmission:'On the detail page, find "Transmission" in specs. Name it: transmission',
        fuelType:    'On the detail page, find "Fuel Type" or MPG. Name it: fuel_type',
        bodyStyle:   'On the detail page, find "Body Style" in specs. Name it: body_style',
        exteriorColor:'On the detail page, find "Exterior Color" in specs. Name it: color',
        interiorColor:'On the detail page, find "Interior Color" in specs. Name it: interior_color',
        drivetrain:  'On the detail page, find "Drivetrain" in specs. Name it: drivetrain',
        engine:      'On the detail page, find "Engine" in specs. Name it: engine',
        trim:        'On the detail page, find trim level (SE, XLE, etc.). Name it: trim',
        features:    'On the detail page, grab the features/highlights list. Name it: features',
        accidents:   'On the detail page, find "Accidents reported" from vehicle history. Name it: accidents',
        owners:      'On the detail page, find "Owner count" from vehicle history. Name it: owners',
        dealerPhone: 'On the detail page, find the dealer phone number. Name it: phone',
        dealerRating:'On the detail page, find dealer star rating. Name it: dealer_rating',
        priceHistory:'On the detail page, find "Price Drop" or "Days on market" badge. Name it: price_drop'
      },
      paginationMethod: 'click_next',
      paginationNotes: 'Click "Next" or page numbers at the bottom. 25 results per page. Max 5 pages.',
      importantNotes: [
        'AutoTrader is mostly dealer listings — results default to sellerType=Dealer',
        'The "Best Deal" sort (derivedpriceDESC) surfaces underpriced vehicles first',
        'AutoTrader shows a "Great Deal" / "Good Deal" badge — capture this as deal_rating if visible',
        'Vehicle history (accidents, owners) comes from AutoCheck — not all listings have it',
        'Some detail pages lazy-load sections — add a 2-second wait in Browse.ai before extraction'
      ]
    }
  },

  CARSCOM: {
    platform: 'Cars.com',
    displayName: 'Cars.com',
    category: 'automotive',
    urlPatterns: [
      /cars\.com/i
    ],
    searchConfig: {
      baseUrl: 'https://www.cars.com/shopping/results/',
      locationFormat: 'zip',
      defaultRadius: 75, // miles
      defaultMinPrice: 1000,
      defaultMaxPrice: 20000,
      defaultMinYear: 2005,
      sortBy: 'best_deal_desc',
      refreshInterval: 60, // minutes
      maxPages: 5,
      listingTypes: ['used', 'certified', 'new'],
      searchKeywords: [
        'great deal', 'good deal', 'fair deal', 'low mileage',
        'one owner', 'no accidents'
      ]
    },
    columnMap: {
      url: ['url', 'link', 'listing_url', 'cars_com_url', 'vehicle_url', 'detail_url'],
      title: ['title', 'name', 'listing_title', 'vehicle_title', 'year_make_model'],
      price: ['price', 'asking_price', 'cost', 'listed_price', 'dealer_price'],
      location: ['location', 'city', 'area', 'dealer_location', 'dealer_city'],
      description: ['description', 'details', 'info', 'vehicle_description', 'seller_notes'],
      sellerInfo: ['seller', 'contact', 'seller_name', 'dealer_name', 'dealership'],
      postedDate: ['date', 'posted', 'listed_date', 'listing_date'],
      images: ['images', 'photos', 'image_count', 'photo_count'],
      mileage: ['mileage', 'miles', 'odometer', 'vehicle_mileage'],
      condition: ['condition', 'vehicle_condition'],
      vin: ['vin', 'vin_number', 'vehicle_vin'],
      transmission: ['transmission', 'trans'],
      fuelType: ['fuel', 'fuel_type', 'mpg'],
      bodyStyle: ['body_style', 'body_type', 'type'],
      exteriorColor: ['color', 'exterior_color'],
      interiorColor: ['interior_color'],
      drivetrain: ['drivetrain', 'drive', 'drive_type'],
      engine: ['engine', 'engine_size'],
      trim: ['trim', 'trim_level'],
      features: ['features', 'options', 'highlights'],
      dealValue: ['deal_rating', 'deal_score', 'price_analysis', 'deal_type'],
      accidents: ['accidents', 'accident_history'],
      owners: ['owners', 'owner_count'],
      dealerPhone: ['phone', 'dealer_phone'],
      dealerRating: ['dealer_rating', 'rating', 'review_count'],
      homeDelivery: ['home_delivery', 'delivery_available'],
      jobLink: ['job_link', 'browse_ai_link']
    },
    fieldDefaults: {
      images: 0,
      condition: 'Used',
      sellerType: 'Dealer'
    },
    sellerDetection: {
      dealerKeywords: [
        'dealership', 'dealer', 'auto sales', 'motors',
        'certified', 'franchise dealer'
      ],
      privateKeywords: [
        'private seller', 'individual', 'for sale by owner'
      ]
    },
    listingIdPattern: /\/vehicledetail\/(\d+)/,
    trainingGuide: {
      startUrl: 'https://www.cars.com/shopping/results/?stock_type=used&zip=63101&maximum_distance=75&year_min=2005&list_price_min=1000&list_price_max=20000&sort=best_deal_desc&per_page=20',
      robotType: 'Extract data from a list of elements on a page',
      steps: [
        'Navigate to Cars.com > Used Cars with your ZIP, radius, and price filters',
        'When Browse.ai asks "What data?", choose "Data from a list"',
        'Click the FIRST vehicle listing card',
        'Confirm all listing cards are highlighted in the repeating pattern',
        'Label card fields: title, price, mileage, dealer, deal rating badge',
        'Click into a listing for detail-page fields (VIN, features, etc.)',
        'Set pagination: Click "Next" or page number links at the bottom'
      ],
      fieldTraining: {
        title:       'Click the vehicle title (e.g. "2019 Honda Accord Sport"). Name it: title',
        price:       'Click the listed price. Name it: price',
        location:    'Click the dealer city/distance text. Name it: location',
        url:         'Auto-captured from the card link. Name it: url',
        mileage:     'Click the mileage on the card. Name it: mileage',
        sellerInfo:  'Click the dealer name on the card. Name it: seller',
        dealValue:   'Click the "Great Deal" / "Good Deal" / "Fair Deal" badge. Name it: deal_rating',
        images:      'On the detail page, grab photo count. Name it: images',
        description: 'On the detail page, find seller notes. Name it: description',
        vin:         'On the detail page, find VIN in vehicle details. Name it: vin',
        transmission:'On the detail page, find "Transmission" in specs. Name it: transmission',
        fuelType:    'On the detail page, find "Fuel type" or MPG. Name it: fuel_type',
        bodyStyle:   'On the detail page, find "Body style" in specs. Name it: body_style',
        exteriorColor:'On the detail page, find "Exterior color". Name it: color',
        interiorColor:'On the detail page, find "Interior color". Name it: interior_color',
        drivetrain:  'On the detail page, find "Drivetrain". Name it: drivetrain',
        engine:      'On the detail page, find "Engine". Name it: engine',
        trim:        'On the detail page, find trim level. Name it: trim',
        features:    'On the detail page, grab features/highlights list. Name it: features',
        accidents:   'On the detail page, find accident history. Name it: accidents',
        owners:      'On the detail page, find owner count. Name it: owners',
        dealerPhone: 'On the detail page, find dealer phone. Name it: phone',
        dealerRating:'On the detail page, find dealer review stars. Name it: dealer_rating',
        homeDelivery:'On the card or detail page, find "Home Delivery" badge. Name it: home_delivery'
      },
      paginationMethod: 'click_next',
      paginationNotes: 'Click "Next" at the bottom. 20 results per page. Max 5 pages.',
      importantNotes: [
        'Cars.com "Best Deal" sort is their own price analysis — great for finding underpriced cars',
        'The deal_rating badge (Great/Good/Fair/High) is very useful for scoring — always capture it',
        'Cars.com has a "Home Delivery" filter — capture this badge if present for convenience scoring',
        'Most listings are dealer — private seller listings are rare on Cars.com',
        'Some detail pages use accordions — you may need "Click to expand" actions for full specs'
      ]
    }
  },

  // =======================================================
  // ATV / POWERSPORTS / SPECIALTY MARKETPLACES
  // =======================================================

  ATV_TRADER: {
    platform: 'ATV Trader',
    displayName: 'ATV Trader',
    category: 'powersports',
    urlPatterns: [
      /atvtrader\.com/i
    ],
    searchConfig: {
      baseUrl: 'https://www.atvtrader.com/atvs-for-sale',
      locationFormat: 'zip-radius',
      defaultRadius: 150, // miles - specialty market needs wider net
      defaultMinPrice: 500,
      defaultMaxPrice: 15000,
      defaultMinYear: 2010,
      sortBy: 'best_match',
      refreshInterval: 120, // minutes
      maxPages: 5,
      vehicleTypes: [
        'ATV Four Wheeler', 'Side By Side', 'UTV',
        'Dune Buggy', 'Go Kart', 'Golf Cart', 'Sand Rail'
      ],
      topMakes: [
        'Polaris', 'Can-Am', 'Honda', 'Yamaha', 'Kawasaki',
        'Arctic Cat', 'Suzuki', 'John Deere', 'Kubota', 'CF Moto'
      ]
    },
    columnMap: {
      url: ['url', 'link', 'listing_url', 'atv_url', 'detail_url'],
      title: ['title', 'name', 'listing_title', 'vehicle_title'],
      price: ['price', 'asking_price', 'cost', 'listed_price'],
      location: ['location', 'city', 'area', 'dealer_location'],
      description: ['description', 'details', 'info', 'vehicle_description'],
      sellerInfo: ['seller', 'contact', 'seller_name', 'dealer_name'],
      postedDate: ['date', 'posted', 'listed_date'],
      images: ['images', 'photos', 'image_count'],
      mileage: ['mileage', 'miles', 'hours', 'engine_hours', 'odometer'],
      condition: ['condition', 'vehicle_condition'],
      vin: ['vin', 'vin_number'],
      engineSize: ['engine', 'engine_size', 'displacement', 'cc'],
      vehicleType: ['type', 'vehicle_type', 'category', 'class'],
      drivetrain: ['drivetrain', 'drive', '4wd', '2wd', '4x4'],
      features: ['features', 'options', 'equipment'],
      sellerPhone: ['phone', 'dealer_phone', 'contact_phone'],
      jobLink: ['job_link', 'browse_ai_link']
    },
    fieldDefaults: {
      images: 0,
      condition: 'Used',
      sellerType: 'Dealer'
    },
    sellerDetection: {
      dealerKeywords: [
        'dealer', 'dealership', 'powersports', 'motorsports',
        'outdoor', 'recreation', 'llc', 'inc'
      ],
      privateKeywords: [
        'private', 'owner', 'personal', 'selling my'
      ]
    },
    listingIdPattern: /\/listing\/(\d+)/,
    trainingGuide: {
      startUrl: 'https://www.atvtrader.com/atvs-for-sale?zip=63101&radius=150&price=500%2C15000&sort=create_date%3Adesc',
      robotType: 'Extract data from a list of elements on a page',
      steps: [
        'Navigate to ATV Trader with your ZIP, radius, and price filters',
        'Choose "Data from a list" and click the first listing card',
        'Confirm all listing cards are highlighted',
        'Label card fields (title, price, location, dealer name)',
        'Click into a listing for detail-page fields',
        'Set pagination: Click "Next" at the bottom'
      ],
      fieldTraining: {
        title:       'Click the ATV/UTV title. Name it: title',
        price:       'Click the price. Name it: price',
        location:    'Click the dealer location. Name it: location',
        url:         'Auto-captured from card link. Name it: url',
        mileage:     'On the detail page, find "Miles" or "Hours". Name it: miles (or hours)',
        description: 'On the detail page, find the description text. Name it: description',
        sellerInfo:  'Click the dealer/seller name. Name it: seller',
        engineSize:  'On the detail page, find engine displacement/CC. Name it: engine_size',
        vehicleType: 'On the detail page, find type (ATV, Side By Side, UTV). Name it: type',
        drivetrain:  'On the detail page, find 4WD/2WD. Name it: drivetrain',
        condition:   'On the detail page, find condition. Name it: condition',
        vin:         'On the detail page, find VIN. Name it: vin'
      },
      paginationMethod: 'click_next',
      paginationNotes: 'Click "Next" at the bottom. Max 5 pages.',
      importantNotes: [
        'ATV Trader uses the same platform as Cycle Trader — similar page structure',
        'Many listings show "Hours" instead of "Miles" — capture whichever is shown',
        'Wider search radius (150+ miles) recommended since inventory is sparser',
        'Set monitor to 120 minutes — powersports inventory moves slower than cars'
      ]
    }
  },

  CYCLE_TRADER: {
    platform: 'Cycle Trader',
    displayName: 'Cycle Trader',
    category: 'powersports',
    urlPatterns: [
      /cycletrader\.com/i
    ],
    searchConfig: {
      baseUrl: 'https://www.cycletrader.com/motorcycles-for-sale',
      locationFormat: 'zip-radius',
      defaultRadius: 150,
      defaultMinPrice: 500,
      defaultMaxPrice: 15000,
      defaultMinYear: 2010,
      sortBy: 'best_match',
      refreshInterval: 120,
      maxPages: 5,
      vehicleTypes: [
        'Cruiser', 'Sportbike', 'Touring', 'Standard',
        'Dual Sport', 'Dirt Bike', 'Scooter', 'Trike',
        'Chopper', 'Adventure'
      ],
      topMakes: [
        'Harley-Davidson', 'Honda', 'Yamaha', 'Kawasaki', 'Suzuki',
        'BMW', 'Ducati', 'Indian', 'Triumph', 'KTM', 'Can-Am'
      ]
    },
    columnMap: {
      url: ['url', 'link', 'listing_url', 'cycle_url', 'detail_url'],
      title: ['title', 'name', 'listing_title', 'vehicle_title'],
      price: ['price', 'asking_price', 'cost', 'listed_price'],
      location: ['location', 'city', 'area', 'dealer_location'],
      description: ['description', 'details', 'info', 'vehicle_description'],
      sellerInfo: ['seller', 'contact', 'seller_name', 'dealer_name'],
      postedDate: ['date', 'posted', 'listed_date'],
      images: ['images', 'photos', 'image_count'],
      mileage: ['mileage', 'miles', 'odometer'],
      condition: ['condition', 'vehicle_condition'],
      vin: ['vin', 'vin_number'],
      engineSize: ['engine', 'engine_size', 'displacement', 'cc'],
      vehicleType: ['type', 'vehicle_type', 'category', 'class', 'style'],
      features: ['features', 'options', 'equipment'],
      sellerPhone: ['phone', 'dealer_phone'],
      jobLink: ['job_link', 'browse_ai_link']
    },
    fieldDefaults: {
      images: 0,
      condition: 'Used',
      sellerType: 'Dealer'
    },
    sellerDetection: {
      dealerKeywords: [
        'dealer', 'dealership', 'motorsports', 'powersports',
        'harley-davidson of', 'honda of', 'llc', 'inc'
      ],
      privateKeywords: [
        'private', 'owner', 'personal'
      ]
    },
    listingIdPattern: /\/listing\/(\d+)/,
    trainingGuide: {
      startUrl: 'https://www.cycletrader.com/motorcycles-for-sale?zip=63101&radius=150&price=500%2C15000&sort=create_date%3Adesc',
      robotType: 'Extract data from a list of elements on a page',
      steps: [
        'Navigate to Cycle Trader with your filters',
        'Choose "Data from a list" and click the first listing card',
        'Confirm all listing cards are highlighted',
        'Label card fields, then click into a listing for details',
        'Set pagination: Click "Next" at the bottom'
      ],
      fieldTraining: {
        title:       'Click the motorcycle title. Name it: title',
        price:       'Click the price. Name it: price',
        location:    'Click the dealer location. Name it: location',
        url:         'Auto-captured from card link. Name it: url',
        mileage:     'On the detail page, find mileage. Name it: mileage',
        description: 'On the detail page, click the description. Name it: description',
        sellerInfo:  'Click the dealer/seller name. Name it: seller',
        engineSize:  'On the detail page, find displacement/CC. Name it: engine_size',
        vehicleType: 'On the detail page, find type (Cruiser, Sportbike, etc.). Name it: type',
        condition:   'On the detail page, find condition. Name it: condition',
        vin:         'On the detail page, find VIN. Name it: vin'
      },
      paginationMethod: 'click_next',
      paginationNotes: 'Click "Next" at the bottom. Max 5 pages.',
      importantNotes: [
        'Same platform as ATV Trader — page structure is nearly identical',
        'Harley-Davidson listings dominate — consider filtering by make if needed',
        'Set monitor to 120 minutes for powersports pace'
      ]
    }
  },

  TRACTOR_HOUSE: {
    platform: 'Tractor House',
    displayName: 'TractorHouse / Machinery Trader',
    category: 'powersports',
    urlPatterns: [
      /tractorhouse\.com/i,
      /machinerytrader\.com/i
    ],
    searchConfig: {
      baseUrl: 'https://www.tractorhouse.com/listings/atvs-utvs',
      locationFormat: 'state-zip',
      defaultRadius: 200, // miles - heavy equipment travels far
      defaultMinPrice: 1000,
      defaultMaxPrice: 25000,
      defaultMinYear: 2010,
      sortBy: 'newest',
      refreshInterval: 180, // minutes
      maxPages: 3,
      vehicleTypes: [
        'ATV', 'UTV', 'Side By Side', 'Utility Vehicle',
        'Mule', 'Gator', 'Ranger'
      ],
      topMakes: [
        'John Deere', 'Kubota', 'Polaris', 'Can-Am',
        'Honda', 'Yamaha', 'Kawasaki', 'Arctic Cat'
      ]
    },
    columnMap: {
      url: ['url', 'link', 'listing_url', 'detail_url'],
      title: ['title', 'name', 'listing_title'],
      price: ['price', 'asking_price', 'cost', 'listed_price'],
      location: ['location', 'city', 'area', 'dealer_location', 'state'],
      description: ['description', 'details', 'info'],
      sellerInfo: ['seller', 'contact', 'seller_name', 'dealer_name', 'company'],
      postedDate: ['date', 'posted', 'listed_date'],
      images: ['images', 'photos', 'image_count'],
      hours: ['hours', 'engine_hours', 'hour_meter'],
      condition: ['condition'],
      serialNumber: ['serial', 'serial_number', 'sn'],
      engineSize: ['engine', 'horsepower', 'hp'],
      vehicleType: ['type', 'category', 'class'],
      features: ['features', 'options', 'equipment', 'specs'],
      sellerPhone: ['phone', 'dealer_phone'],
      jobLink: ['job_link', 'browse_ai_link']
    },
    fieldDefaults: {
      images: 0,
      condition: 'Used',
      sellerType: 'Dealer'
    },
    sellerDetection: {
      dealerKeywords: [
        'dealer', 'equipment', 'tractor', 'farm', 'machinery',
        'implements', 'llc', 'inc', 'co-op'
      ],
      privateKeywords: [
        'private', 'owner', 'farm sale', 'estate'
      ]
    },
    listingIdPattern: /\/listings\/(\d+)/,
    trainingGuide: {
      startUrl: 'https://www.tractorhouse.com/listings/atvs-utvs?sort=newest',
      robotType: 'Extract data from a list of elements on a page',
      steps: [
        'Navigate to TractorHouse > ATVs/UTVs or Machinery Trader',
        'Choose "Data from a list" and click the first listing',
        'Confirm pattern detection, label fields',
        'Click into a listing for detail fields',
        'Set pagination via "Next" button'
      ],
      fieldTraining: {
        title:       'Click the listing title. Name it: title',
        price:       'Click the price (may say "Call for Price"). Name it: price',
        location:    'Click dealer location/state. Name it: location',
        url:         'Auto-captured. Name it: url',
        hours:       'On detail page, find engine hours. Name it: hours',
        description: 'On detail page, click description. Name it: description',
        sellerInfo:  'Click dealer/company name. Name it: seller',
        serialNumber:'On detail page, find serial number. Name it: serial',
        engineSize:  'On detail page, find horsepower/HP. Name it: engine',
        vehicleType: 'On detail page, find category (ATV, UTV, etc.). Name it: type',
        condition:   'On detail page, find condition. Name it: condition'
      },
      paginationMethod: 'click_next',
      paginationNotes: 'Click "Next" at the bottom. Max 3 pages.',
      importantNotes: [
        'TractorHouse often uses "Hours" instead of "Miles" — capture engine hours',
        'Many listings say "Call for Price" — these import as empty price fields',
        'Uses serial numbers instead of VINs — mapped to serialNumber field',
        'Set monitor to 180 minutes — equipment inventory changes slowly'
      ]
    }
  },

  POWERSPORTS_LISTINGS: {
    platform: 'Powersports Listings',
    displayName: 'Powersports Listings (Multi-Source)',
    category: 'powersports',
    urlPatterns: [
      /powersportslistings\.com/i,
      /sledtrader\.com/i,
      /pwctrader\.com/i,
      /boattrader\.com/i
    ],
    searchConfig: {
      baseUrl: 'https://www.pwctrader.com/', // or sledtrader, boattrader
      locationFormat: 'zip-radius',
      defaultRadius: 200,
      defaultMinPrice: 500,
      defaultMaxPrice: 15000,
      defaultMinYear: 2010,
      sortBy: 'newest',
      refreshInterval: 120,
      maxPages: 3,
      subPlatforms: {
        pwc: 'pwctrader.com',     // Personal Watercraft
        sled: 'sledtrader.com',    // Snowmobiles
        boat: 'boattrader.com'     // Boats (for pontoons, fishing boats)
      },
      vehicleTypes: [
        'Jet Ski', 'Waverunner', 'Sea-Doo', 'Snowmobile',
        'Pontoon', 'Bass Boat', 'Fishing Boat'
      ],
      topMakes: [
        'Yamaha', 'Sea-Doo', 'Kawasaki', 'Polaris',
        'Arctic Cat', 'Ski-Doo', 'Honda'
      ]
    },
    columnMap: {
      url: ['url', 'link', 'listing_url', 'detail_url'],
      title: ['title', 'name', 'listing_title'],
      price: ['price', 'asking_price', 'cost'],
      location: ['location', 'city', 'area', 'dealer_location'],
      description: ['description', 'details', 'info'],
      sellerInfo: ['seller', 'contact', 'seller_name', 'dealer_name'],
      postedDate: ['date', 'posted', 'listed_date'],
      images: ['images', 'photos', 'image_count'],
      hours: ['hours', 'engine_hours'],
      condition: ['condition'],
      vin: ['vin', 'hin', 'hull_id'], // HIN for watercraft
      engineSize: ['engine', 'engine_size', 'cc', 'horsepower'],
      vehicleType: ['type', 'category', 'class'],
      features: ['features', 'options'],
      sellerPhone: ['phone', 'dealer_phone'],
      jobLink: ['job_link', 'browse_ai_link']
    },
    fieldDefaults: {
      images: 0,
      condition: 'Used',
      sellerType: 'Dealer'
    },
    sellerDetection: {
      dealerKeywords: [
        'dealer', 'marine', 'motorsports', 'powersports',
        'watersports', 'llc', 'inc'
      ],
      privateKeywords: [
        'private', 'owner', 'personal'
      ]
    },
    listingIdPattern: /\/listing\/(\d+)/,
    trainingGuide: {
      startUrl: 'https://www.pwctrader.com/',
      robotType: 'Extract data from a list of elements on a page',
      steps: [
        'Navigate to PWC Trader, Sled Trader, or Boat Trader with your filters',
        'Choose "Data from a list" and click the first listing',
        'Confirm pattern, label fields, then train detail page',
        'Set pagination via "Next" button'
      ],
      fieldTraining: {
        title:       'Click the listing title. Name it: title',
        price:       'Click the price. Name it: price',
        location:    'Click dealer location. Name it: location',
        url:         'Auto-captured. Name it: url',
        hours:       'On detail page, find engine hours. Name it: hours',
        description: 'On detail page, click description. Name it: description',
        sellerInfo:  'Click dealer/seller name. Name it: seller',
        engineSize:  'On detail page, find displacement/HP. Name it: engine_size',
        vehicleType: 'On detail page, find type (Jet Ski, Snowmobile, etc.). Name it: type',
        vin:         'On detail page, find VIN or HIN (Hull ID for watercraft). Name it: vin',
        condition:   'On detail page, find condition. Name it: condition'
      },
      paginationMethod: 'click_next',
      paginationNotes: 'Click "Next" at the bottom. Max 3 pages.',
      importantNotes: [
        'Create separate robots for each sub-platform (PWC Trader, Sled Trader, Boat Trader)',
        'Watercraft use HIN (Hull Identification Number) instead of VIN — same field',
        'These sites share the Trader Interactive platform — similar page structure',
        'Set monitor to 120 minutes for powersports pace'
      ]
    }
  }
};

// =======================================================
// ROBOT HELPER FUNCTIONS
// =======================================================

/**
 * Get robot config by platform name (case-insensitive match).
 */
function getRobotConfig(platform) {
  const platformLower = platform.toLowerCase();
  for (const [key, config] of Object.entries(ROBOT_REGISTRY)) {
    if (config.platform.toLowerCase() === platformLower ||
        config.displayName.toLowerCase() === platformLower) {
      return config;
    }
  }
  return null;
}

/**
 * Detect platform from URL using robot registry patterns.
 * Enhanced version of detectPlatformFromURL that uses regex patterns.
 */
function detectPlatformFromURLAdvanced(url) {
  if (!url) return 'Other';
  for (const [key, config] of Object.entries(ROBOT_REGISTRY)) {
    for (const pattern of config.urlPatterns) {
      if (pattern.test(url)) {
        return config.platform;
      }
    }
  }
  return 'Other';
}

/**
 * Get the platform-specific column map for a given platform.
 * Falls back to generic mappings if platform not found.
 */
function getPlatformColumnMap(platform) {
  const config = getRobotConfig(platform);
  if (config) return config.columnMap;

  // Generic fallback
  return {
    url: ['url', 'link', 'listing_url', 'ad_url'],
    title: ['title', 'name', 'listing_title', 'vehicle'],
    price: ['price', 'asking_price', 'cost'],
    location: ['location', 'city', 'area'],
    description: ['description', 'details', 'info'],
    sellerInfo: ['seller', 'contact', 'seller_name'],
    postedDate: ['date', 'posted', 'listed_date'],
    images: ['images', 'photos', 'image_count'],
    jobLink: ['job_link', 'browse_ai_link']
  };
}

/**
 * Extract unique listing ID from a URL using platform-specific patterns.
 */
function extractListingId(url, platform) {
  const config = getRobotConfig(platform);
  if (!config || !config.listingIdPattern) return null;

  const match = url.match(config.listingIdPattern);
  return match ? match[1] : null;
}

/**
 * Detect seller type using platform-specific keyword lists.
 */
function detectSellerType(sellerInfo, description, platform) {
  const config = getRobotConfig(platform);
  const detection = config ? config.sellerDetection : {
    dealerKeywords: ['dealer', 'dealership', 'auto sales'],
    privateKeywords: ['private', 'owner', 'personal']
  };

  const combined = ((sellerInfo || '') + ' ' + (description || '')).toLowerCase();

  for (const keyword of detection.dealerKeywords) {
    if (combined.includes(keyword.toLowerCase())) return 'Dealer';
  }
  for (const keyword of detection.privateKeywords) {
    if (combined.includes(keyword.toLowerCase())) return 'Private';
  }

  // Platform-level defaults
  if (config && config.fieldDefaults && config.fieldDefaults.sellerType) {
    return config.fieldDefaults.sellerType;
  }
  return 'Unknown';
}

/**
 * Get search configuration for setting up a new Browse.ai robot.
 * Returns recommended search parameters for the given platform.
 */
function getRobotSearchConfig(platform) {
  const config = getRobotConfig(platform);
  if (!config) return null;

  return {
    platform: config.platform,
    displayName: config.displayName,
    category: config.category,
    search: config.searchConfig,
    instructions: buildRobotSetupInstructions(config)
  };
}

/**
 * Build human-readable setup instructions for configuring
 * a Browse.ai robot for a specific marketplace.
 */
function buildRobotSetupInstructions(config) {
  const sc = config.searchConfig;
  const tg = config.trainingGuide;
  const lines = [];

  // ── HEADER ──
  lines.push(`${'='.repeat(60)}`);
  lines.push(`  Browse.ai Robot Setup: ${config.displayName}`);
  lines.push(`  Category: ${config.category}`);
  lines.push(`${'='.repeat(60)}`);
  lines.push('');

  // ── PART 1: CREATE THE ROBOT ──
  lines.push('PART 1: CREATE THE ROBOT IN BROWSE.AI');
  lines.push('-'.repeat(40));
  lines.push('');
  lines.push('1. Log into browse.ai and click "+ New Robot"');
  lines.push(`2. Choose robot type: "${tg ? tg.robotType : 'Extract data from a list of elements on a page'}"`);
  lines.push(`3. Paste this starting URL into the address bar:`);
  lines.push(`   ${tg ? tg.startUrl : sc.baseUrl}`);
  lines.push('4. Browse.ai will load the page in its built-in browser');
  lines.push('');

  // ── PART 2: SEARCH FILTERS ──
  lines.push('PART 2: SEARCH FILTERS (apply before training)');
  lines.push('-'.repeat(40));
  lines.push('');
  lines.push(`  Location:   ZIP ${QUANTUM_CONFIG.HOME_ZIP} / ${sc.defaultRadius} mile radius`);
  lines.push(`  Price:      $${sc.defaultMinPrice} - $${sc.defaultMaxPrice}`);
  if (sc.defaultMinYear) {
    lines.push(`  Year:       ${sc.defaultMinYear}+`);
  }
  lines.push(`  Sort by:    ${sc.sortBy}`);
  lines.push('');
  if (sc.searchKeywords && sc.searchKeywords.length > 0) {
    lines.push('  Useful search keywords:');
    for (const kw of sc.searchKeywords) {
      lines.push(`    - "${kw}"`);
    }
    lines.push('');
  }
  if (sc.vehicleTypes && sc.vehicleTypes.length > 0) {
    lines.push('  Vehicle types to filter for:');
    for (const vt of sc.vehicleTypes) {
      lines.push(`    - ${vt}`);
    }
    lines.push('');
  }
  if (sc.topMakes && sc.topMakes.length > 0) {
    lines.push('  Top makes to watch:');
    for (const make of sc.topMakes) {
      lines.push(`    - ${make}`);
    }
    lines.push('');
  }

  // ── PART 3: TRAINING THE ROBOT ──
  lines.push('PART 3: TRAINING — TELL BROWSE.AI WHAT TO EXTRACT');
  lines.push('-'.repeat(40));
  lines.push('');

  if (tg && tg.steps) {
    lines.push('Follow these steps in the Browse.ai trainer:');
    lines.push('');
    for (let i = 0; i < tg.steps.length; i++) {
      lines.push(`  ${i + 1}. ${tg.steps[i]}`);
    }
    lines.push('');
  }

  // ── PART 4: FIELD-BY-FIELD TRAINING ──
  if (tg && tg.fieldTraining) {
    lines.push('PART 4: FIELD-BY-FIELD TRAINING GUIDE');
    lines.push('-'.repeat(40));
    lines.push('');
    lines.push('For each field below, click the matching element on the page');
    lines.push('and assign it the specified name. USE THESE EXACT NAMES so');
    lines.push('CarHawk can auto-map them to the correct columns.');
    lines.push('');

    // Group into required (core) and optional fields
    const coreFields = ['title', 'price', 'location', 'url', 'mileage', 'description', 'sellerInfo', 'postedDate', 'images'];
    const trainingEntries = Object.entries(tg.fieldTraining);
    const core = trainingEntries.filter(([k]) => coreFields.includes(k));
    const extra = trainingEntries.filter(([k]) => !coreFields.includes(k));

    lines.push('  REQUIRED FIELDS (always train these):');
    for (const [field, instruction] of core) {
      lines.push(`    [${field}]`);
      lines.push(`      ${instruction}`);
    }
    lines.push('');
    lines.push('  OPTIONAL FIELDS (train if visible on the page):');
    for (const [field, instruction] of extra) {
      lines.push(`    [${field}]`);
      lines.push(`      ${instruction}`);
    }
    lines.push('');
  } else {
    // Fallback: just list columnMap keys
    lines.push('PART 4: FIELDS TO CAPTURE');
    lines.push('-'.repeat(40));
    lines.push('');
    lines.push('Train the robot to extract these fields (use these names):');
    const fieldNames = Object.keys(config.columnMap).filter(k => k !== 'jobLink');
    for (const field of fieldNames) {
      const aliases = config.columnMap[field];
      lines.push(`  - ${field}  (accepted names: ${aliases.slice(0, 3).join(', ')})`);
    }
    lines.push('');
  }

  // ── PART 5: PAGINATION ──
  lines.push('PART 5: PAGINATION');
  lines.push('-'.repeat(40));
  lines.push('');
  if (tg) {
    if (tg.paginationMethod === 'infinite_scroll') {
      lines.push('  Method: Infinite Scroll');
      lines.push('  In Browse.ai trainer, enable "Scroll to load more" and set:');
    } else {
      lines.push('  Method: Click "Next" Button');
      lines.push('  In Browse.ai trainer, click the "Next" navigation element and set:');
    }
    lines.push(`  ${tg.paginationNotes}`);
  } else {
    lines.push(`  Set max pages: ${sc.maxPages}`);
  }
  lines.push('');

  // ── PART 6: SCHEDULING ──
  lines.push('PART 6: MONITOR SCHEDULE');
  lines.push('-'.repeat(40));
  lines.push('');
  lines.push(`  Set the robot to run every ${sc.refreshInterval} minutes`);
  lines.push('  Recommended schedule: During business hours (6 AM - 10 PM)');
  lines.push('  This ensures fresh listings without burning API credits overnight');
  lines.push('');

  // ── PART 7: EXPORT + CONNECT TO CARHAWK ──
  lines.push('PART 7: CONNECT TO CARHAWK');
  lines.push('-'.repeat(40));
  lines.push('');
  lines.push('  Option A — Google Sheets export (simple):');
  lines.push('    1. In Browse.ai, set export to "Google Sheets" (new spreadsheet)');
  lines.push('    2. Copy the Sheet ID from the URL (the long string between /d/ and /edit)');
  lines.push('    3. In CarHawk, run: registerBrowseAIRobot()');
  lines.push(`    4. Set platform to "${config.platform}"`);
  lines.push('    5. Paste the Sheet ID when prompted');
  lines.push('');
  lines.push('  Option B — API + Webhook (automated):');
  lines.push('    1. In CarHawk, run: setBrowseAIApiKeyUI() and enter your Browse.ai API key');
  lines.push('    2. Run: linkBrowseAIRobotUI() to connect the robot');
  lines.push('    3. Browse.ai will push data to CarHawk automatically via API');
  lines.push('    4. Optionally run: deployRobotUI() to trigger an immediate bulk scrape');
  lines.push('');

  // ── IMPORTANT NOTES ──
  if (tg && tg.importantNotes && tg.importantNotes.length > 0) {
    lines.push('IMPORTANT NOTES');
    lines.push('-'.repeat(40));
    lines.push('');
    for (const note of tg.importantNotes) {
      lines.push(`  ⚠ ${note}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Register a new Browse.ai robot as an integration in the system.
 * Called after setting up a robot on Browse.ai and getting the export sheet.
 */
function registerBrowseAIRobot(platform, sheetId, robotName) {
  const config = getRobotConfig(platform);
  if (!config) {
    throw new Error(`Unknown platform: ${platform}. Valid: ${Object.values(ROBOT_REGISTRY).map(r => r.platform).join(', ')}`);
  }

  const integrationId = addIntegration({
    provider: 'Browse.ai',
    type: 'Robot',
    name: robotName || `${config.displayName} Robot`,
    key: sheetId,
    syncFrequency: String(config.searchConfig.refreshInterval),
    configuration: JSON.stringify({
      platform: config.platform,
      category: config.category,
      searchConfig: config.searchConfig
    }),
    features: Object.keys(config.columnMap).join(', '),
    notes: config.platform
  });

  logQuantum('Robot Registered', `${config.displayName} robot registered as ${integrationId}`);

  return integrationId;
}

/**
 * Interactive robot registration via UI prompt.
 */
function registerRobotUI() {
  const ui = SpreadsheetApp.getUi();

  // Build platform selection list
  const platforms = Object.values(ROBOT_REGISTRY).map(r => r.displayName);
  const platformList = platforms.map((p, i) => `${i + 1}. ${p}`).join('\n');

  const platformResponse = ui.prompt(
    'Register Browse.ai Robot',
    `Select platform number:\n\n${platformList}`,
    ui.ButtonSet.OK_CANCEL
  );

  if (platformResponse.getSelectedButton() !== ui.Button.OK) return;

  const platformIndex = parseInt(platformResponse.getResponseText()) - 1;
  if (isNaN(platformIndex) || platformIndex < 0 || platformIndex >= platforms.length) {
    ui.alert('Invalid selection.');
    return;
  }

  const selectedConfig = Object.values(ROBOT_REGISTRY)[platformIndex];

  const sheetResponse = ui.prompt(
    'Google Sheet ID',
    'Enter the Google Sheet ID from the Browse.ai export sheet URL:\n\n' +
    '(The long string between /d/ and /edit in the URL)',
    ui.ButtonSet.OK_CANCEL
  );

  if (sheetResponse.getSelectedButton() !== ui.Button.OK) return;

  const sheetId = sheetResponse.getResponseText().trim();
  if (!sheetId) {
    ui.alert('Sheet ID is required.');
    return;
  }

  const nameResponse = ui.prompt(
    'Robot Name (Optional)',
    `Enter a custom name or leave blank for "${selectedConfig.displayName} Robot":`,
    ui.ButtonSet.OK_CANCEL
  );

  const robotName = nameResponse.getResponseText().trim() || null;

  try {
    const integrationId = registerBrowseAIRobot(selectedConfig.platform, sheetId, robotName);
    ui.alert(`Robot registered successfully!\n\nIntegration ID: ${integrationId}\nPlatform: ${selectedConfig.displayName}\n\nRun "Import from Browse.ai" to start pulling data.`);
  } catch (error) {
    ui.alert(`Registration failed: ${error.toString()}`);
  }
}

/**
 * Show setup instructions for all platforms or a specific one.
 */
function showRobotSetupGuide() {
  const ui = SpreadsheetApp.getUi();

  const platforms = Object.values(ROBOT_REGISTRY);
  const platformList = platforms.map((p, i) => `${i + 1}. ${p.displayName} (${p.category})`).join('\n');

  const response = ui.prompt(
    'Robot Setup Guide',
    `Select platform number for setup instructions:\n\n${platformList}\n\nOr enter 0 to show all:`,
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) return;

  const selection = parseInt(response.getResponseText());

  if (selection === 0) {
    // Show all
    let allInstructions = '';
    for (const config of platforms) {
      allInstructions += buildRobotSetupInstructions(config) + '\n\n' + '='.repeat(60) + '\n\n';
    }
    showLargeText_('All Robot Setup Guides', allInstructions);
  } else {
    const config = platforms[selection - 1];
    if (!config) {
      ui.alert('Invalid selection.');
      return;
    }
    showLargeText_(`${config.displayName} Setup Guide`, buildRobotSetupInstructions(config));
  }
}

/**
 * Display large text in a modeless dialog (for setup guides).
 */
function showLargeText_(title, text) {
  const html = HtmlService.createHtmlOutput(
    '<pre style="font-family: monospace; font-size: 13px; white-space: pre-wrap; padding: 16px;">' +
    text.replace(/</g, '&lt;').replace(/>/g, '&gt;') +
    '</pre>'
  )
    .setWidth(700)
    .setHeight(500);
  SpreadsheetApp.getUi().showModelessDialog(html, title);
}

/**
 * List all registered Browse.ai robots and their sync status.
 */
function listRegisteredRobots() {
  const integrations = getActiveIntegrations();
  const robots = integrations.filter(i => i.provider === 'Browse.ai');

  if (robots.length === 0) {
    return { count: 0, robots: [], summary: 'No Browse.ai robots registered.' };
  }

  const robotList = robots.map(r => {
    let config = {};
    try { config = JSON.parse(r.configuration || '{}'); } catch (e) {}
    return {
      id: r.integrationId,
      name: r.name,
      platform: r.notes || config.platform || 'Unknown',
      category: config.category || 'automotive',
      sheetId: r.key,
      status: r.status,
      lastSync: r.lastSync
    };
  });

  return {
    count: robotList.length,
    robots: robotList,
    summary: robotList.map(r => `${r.platform}: ${r.name} (${r.status})`).join('\n')
  };
}

/**
 * Get all supported platforms grouped by category.
 */
function getSupportedPlatforms() {
  const automotive = [];
  const powersports = [];

  for (const [key, config] of Object.entries(ROBOT_REGISTRY)) {
    const entry = {
      key: key,
      platform: config.platform,
      displayName: config.displayName,
      fieldCount: Object.keys(config.columnMap).length,
      refreshMinutes: config.searchConfig.refreshInterval
    };

    if (config.category === 'automotive') {
      automotive.push(entry);
    } else {
      powersports.push(entry);
    }
  }

  return { automotive, powersports };
}
