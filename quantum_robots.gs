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
    listingIdPattern: /\/item\/(\d+)/
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
    listingIdPattern: /\/(\d{10,})\./
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
    listingIdPattern: /\/detail\/(\d+)/
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
    listingIdPattern: /\/itm\/(\d+)/
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
    listingIdPattern: /\/(\d{9,})/
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
    listingIdPattern: /\/vehicledetail\/(\d+)/
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
    listingIdPattern: /\/listing\/(\d+)/
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
    listingIdPattern: /\/listing\/(\d+)/
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
    listingIdPattern: /\/listings\/(\d+)/
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
    listingIdPattern: /\/listing\/(\d+)/
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
  const lines = [
    `=== Browse.ai Robot Setup: ${config.displayName} ===`,
    '',
    `1. Go to Browse.ai and create a new "Monitor" robot`,
    `2. Target URL: ${sc.baseUrl}`,
    `3. Location: Use home ZIP ${QUANTUM_CONFIG.HOME_ZIP} with ${sc.defaultRadius} mile radius`,
    `4. Price range: $${sc.defaultMinPrice} - $${sc.defaultMaxPrice}`,
    `5. Year range: ${sc.defaultMinYear}+`,
    `6. Sort by: ${sc.sortBy}`,
    `7. Set monitor schedule: Every ${sc.refreshInterval} minutes`,
    `8. Export destination: Google Sheets (new spreadsheet)`,
    '',
    'Fields to capture (train the robot on these):',
  ];

  const fieldNames = Object.keys(config.columnMap).filter(k => k !== 'jobLink');
  for (const field of fieldNames) {
    lines.push(`  - ${field}`);
  }

  lines.push('');
  lines.push('After setup:');
  lines.push('  1. Copy the Google Sheet ID from the export sheet URL');
  lines.push('  2. Run registerBrowseAIRobot() in CarHawk to register it');
  lines.push(`  3. Set platform to "${config.platform}" in the integration notes`);

  if (sc.searchKeywords && sc.searchKeywords.length > 0) {
    lines.push('');
    lines.push('Recommended search keywords:');
    for (const kw of sc.searchKeywords) {
      lines.push(`  - "${kw}"`);
    }
  }

  if (sc.vehicleTypes && sc.vehicleTypes.length > 0) {
    lines.push('');
    lines.push('Vehicle types to monitor:');
    for (const vt of sc.vehicleTypes) {
      lines.push(`  - ${vt}`);
    }
  }

  if (sc.topMakes && sc.topMakes.length > 0) {
    lines.push('');
    lines.push('Top makes to watch:');
    for (const make of sc.topMakes) {
      lines.push(`  - ${make}`);
    }
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
