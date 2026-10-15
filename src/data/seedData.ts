import { Campus, Category, Product, User, Order, SellerReview } from '../types';

export const CAMPUSES: Campus[] = [
  {
    id: 'all',
    name: 'All Campuses (Nationwide)',
    shortName: 'All Universities',
    state: 'Nigeria (Cross-Campus & Inter-State)',
    hostels: ['Campus Hostels', 'Off-Campus Private Lodges', 'Inter-Campus Logistics'],
    safeMeetupPoints: ['Campus Main Gate', 'Student Union Building (SUB)', 'University Central Library']
  },
  {
    id: 'unizik',
    name: 'Nnamdi Azikiwe University (UNIZIK)',
    shortName: 'UNIZIK',
    state: 'Anambra (Awka/Nnewi)',
    hostels: [
      'Ifite Hostel Area (First & Second Gate)',
      'Amansea Student Quarters',
      'Perm Site Student Lodges',
      'Miracle Center / Regina Caeli Junction',
      'Diamond Valley Hostel',
      'Elm Court & Royal Lodges',
      'School Hostel (Male & Female Blocks)',
      'Arthur Eze Avenue Lodges'
    ],
    safeMeetupPoints: [
      'Digital Library (Festus Aghagbo Hall)',
      'UNIZIK Main Gate (Bank Area)',
      'Faculty of Law Quadrangle',
      'Chisco Student Transport Park',
      'Faculty of Engineering Pavilion'
    ]
  },
  {
    id: 'unilag',
    name: 'University of Lagos (UNILAG)',
    shortName: 'UNILAG',
    state: 'Lagos (Akoka & Yaba)',
    hostels: [
      'Moremi Hall',
      'Jaja Hall',
      'Mariere Hall',
      'Fagunwa Hall',
      'Biobaku Hall',
      'New Hall Complex',
      'Eni Njoku Hall',
      'Madam Tinubu Hall'
    ],
    safeMeetupPoints: [
      'UNILAG New Hall Shopping Arena',
      'Faculty of Arts Car Park',
      'Amphitheatre Ground',
      'Senate Building Quadrangle'
    ]
  },
  {
    id: 'unn',
    name: 'University of Nigeria, Nsukka (UNN)',
    shortName: 'UNN',
    state: 'Enugu (Nsukka/Enugu)',
    hostels: [
      'Franco Hostel',
      'Eni Njoku Hall',
      'Zik’s Flat',
      'Mary Slessor Hall',
      'Alvan Ikoku Hall',
      'Aba House'
    ],
    safeMeetupPoints: [
      'SUB (Student Union Building)',
      'Freedom Square',
      'Nnamdi Azikiwe Library Front',
      'Faculty of Social Sciences Arena'
    ]
  },
  {
    id: 'oau',
    name: 'Obafemi Awolowo University (OAU)',
    shortName: 'OAU',
    state: 'Osun (Ile-Ife)',
    hostels: [
      'Angola Hall',
      'Mozambique Hall',
      'Moremi Hall',
      'Fajuyi Hall',
      'Awolowo Hall',
      'Akindeko Hall'
    ],
    safeMeetupPoints: [
      'SUB Building & Car Park',
      'Oduduwa Hall Quadrangle',
      'Hezekiah Oluwasanmi Library Steps',
      'Motion Ground'
    ]
  },
  {
    id: 'ui',
    name: 'University of Ibadan (UI)',
    shortName: 'UI',
    state: 'Oyo (Ibadan)',
    hostels: [
      'Mellanby Hall',
      'Tedder Hall',
      'Kuti Hall',
      'Queen Idia Hall',
      'Alexander Brown Hall (UCH)',
      'Independence Hall'
    ],
    safeMeetupPoints: [
      'UI Central SUB Plaza',
      'Kenneth Dike Library Frontage',
      'Faculty of Technology Gate'
    ]
  },
  {
    id: 'futo',
    name: 'Federal University of Technology, Owerri (FUTO)',
    shortName: 'FUTO',
    state: 'Imo (Owerri/Ihiagwa)',
    hostels: [
      'Hostel A (Male)',
      'Hostel B (Female)',
      'Hostel C (PG)',
      'Ihiagwa Student Village',
      'Eziobodo Lodges',
      'Umuchima Quarters'
    ],
    safeMeetupPoints: [
      'ICT Centre Roundabout',
      'SOET Complex Canopy',
      'FUTO Main Gate Pavilion'
    ]
  },
  {
    id: 'abu',
    name: 'Ahmadu Bello University (ABU)',
    shortName: 'ABU',
    state: 'Kaduna (Zaria)',
    hostels: [
      'Ibrahim Kashim Hall',
      'Aminu Kano Hall',
      'Alexander Hall',
      'Suleiman Hall',
      'Ribadu Hall'
    ],
    safeMeetupPoints: [
      'Kashim Ibrahim Library Square',
      'ABU Assembly Hall',
      'Samaru Main Campus Gate'
    ]
  },
  {
    id: 'uniben',
    name: 'University of Benin (UNIBEN)',
    shortName: 'UNIBEN',
    state: 'Edo (Benin City)',
    hostels: ['Hall 1', 'Hall 2', 'Hall 3', 'Hall 4', 'Ekosodin Student Lodges'],
    safeMeetupPoints: ['Ugbowo Main Gate', 'June 12 Secretariat', 'Basement Arena']
  },
  {
    id: 'uniport',
    name: 'University of Port Harcourt (UNIPORT)',
    shortName: 'UNIPORT',
    state: 'Rivers (Port Harcourt)',
    hostels: ['Dan Anyiam Hall', 'Claude Ake Hall', 'Nelson Mandela Hall', 'Abuja Campus Hostels'],
    safeMeetupPoints: ['Delta Park Pavilion', 'Donald Ekong Library', 'Choba Campus Gate']
  },
  {
    id: 'covenant',
    name: 'Covenant University (CU)',
    shortName: 'Covenant',
    state: 'Ogun (Ota)',
    hostels: ['Peter Hall', 'Paul Hall', 'Esther Hall', 'Lydia Hall', 'Dorcas Hall'],
    safeMeetupPoints: ['Student Center Plaza', 'University Cafeteria 1', 'Chapel Walkway']
  }
];

export const CATEGORIES: Category[] = [
  {
    id: 'electronics',
    name: 'Electronics',
    slug: 'electronics',
    subtitle: 'Phones, laptops & gadgets',
    icon: 'Laptop'
  },
  {
    id: 'fashion',
    name: 'Fashion & accessories',
    slug: 'fashion',
    subtitle: 'Wear it your way',
    icon: 'Shirt'
  },
  {
    id: 'food',
    name: 'Food & groceries',
    slug: 'food',
    subtitle: 'Good things, close by',
    icon: 'ShoppingBasket'
  },
  {
    id: 'beauty',
    name: 'Beauty',
    slug: 'beauty',
    subtitle: 'Everyday care & beauty',
    icon: 'Sparkles'
  },
  {
    id: 'books',
    name: 'Books & stationery',
    slug: 'books',
    subtitle: 'Study essentials',
    icon: 'BookOpen'
  },
  {
    id: 'home',
    name: 'Home & dorm',
    slug: 'home',
    subtitle: 'Make your space yours',
    icon: 'Bed'
  },
  {
    id: 'services',
    name: 'Services',
    slug: 'services',
    subtitle: 'People who can help',
    icon: 'Wrench'
  },
  {
    id: 'other',
    name: 'Other',
    slug: 'other',
    subtitle: 'A little bit of everything',
    icon: 'Briefcase'
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'user_chiamaka',
    name: 'Chiamaka Okoli',
    email: 'chiamaka.student@abbasonhub.ng',
    phone: '+234 814 559 8210',
    role: 'student',
    campusId: 'unizik',
    campusName: 'Nnamdi Azikiwe University (UNIZIK)',
    hostel: 'Diamond Valley Hostel, Ifite',
    isVerifiedSeller: false,
    sellerVerificationStatus: 'not_applied'
  },
  {
    id: 'user_emeka',
    name: 'Emeka Chukwu',
    email: 'emeka.gadgets@abbasonhub.ng',
    phone: '+234 803 412 9081',
    role: 'seller',
    campusId: 'unizik',
    campusName: 'Nnamdi Azikiwe University (UNIZIK)',
    hostel: 'Ifite First Gate Commercial Block',
    isVerifiedSeller: true,
    sellerVerificationStatus: 'verified',
    storeName: 'Emeka Campus Gadgets',
    bio: 'Verified student electronics technician and certified campus reseller. 100% verified UK-used hardware.',
    rating: 4.9,
    reviewsCount: 38,
    salesCount: 42,
    bankDetails: {
      bankName: 'Access Bank Nigeria',
      accountNumberMasked: '******4819',
      accountName: 'Emeka Chukwu'
    }
  },
  {
    id: 'user_amara',
    name: 'Amara Nnadi',
    email: 'amara.treats@abbasonhub.ng',
    phone: '+234 706 881 2304',
    role: 'seller',
    campusId: 'unizik',
    campusName: 'Nnamdi Azikiwe University (UNIZIK)',
    hostel: 'Amansea Student Quarters',
    isVerifiedSeller: true,
    sellerVerificationStatus: 'verified',
    storeName: 'Amara Treats & Thrift',
    bio: 'Fresh daily student lunch bowls & curated university thrift fashion.',
    rating: 4.8,
    reviewsCount: 24,
    salesCount: 88,
    bankDetails: {
      bankName: 'Zenith Bank PLC',
      accountNumberMasked: '******9203',
      accountName: 'Amara Nnadi'
    }
  },
  {
    id: 'user_tunde',
    name: 'Tunde Adeleke',
    email: 'tunde.tech@abbasonhub.ng',
    phone: '+234 802 771 9901',
    role: 'seller',
    campusId: 'unilag',
    campusName: 'University of Lagos (UNILAG)',
    hostel: 'New Hall Shopping Complex',
    isVerifiedSeller: true,
    sellerVerificationStatus: 'verified',
    storeName: 'Akoka Tech Store',
    bio: 'MacBooks, iPhones, and authentic audio gear for university creatives.',
    rating: 5.0,
    reviewsCount: 19,
    salesCount: 31,
    bankDetails: {
      bankName: 'Guaranty Trust Bank (GTBank)',
      accountNumberMasked: '******1108',
      accountName: 'Tunde Adeleke'
    }
  },
  {
    id: 'user_admin',
    name: 'Abbason Trust & Moderation (Owner)',
    email: 'chukwuagoziemgracious@gmail.com',
    phone: '+234 800 222 2766',
    role: 'admin',
    campusId: 'all',
    campusName: 'All Campuses (Nationwide)',
    hostel: 'Abbason Headquarters',
    isVerifiedSeller: true,
    sellerVerificationStatus: 'verified'
  }
];

export const INITIAL_SELLER_REVIEWS: SellerReview[] = [
  {
    id: 'rev_1',
    sellerId: 'user_emeka',
    sellerName: 'Emeka Campus Gadgets',
    orderId: 'order_1001',
    buyerId: 'user_chiamaka',
    buyerName: 'Chiamaka Okoli',
    campusName: 'UNIZIK (Awka)',
    rating: 5,
    comment: 'Collected at Digital Library! Emeka allowed me to benchmark the laptop and inspect the battery health before I gave him the 6-digit delivery OTP code. Super honest student seller!',
    createdAt: '2026-10-14T08:00:00Z',
    verifiedPurchase: true
  },
  {
    id: 'rev_2',
    sellerId: 'user_emeka',
    sellerName: 'Emeka Campus Gadgets',
    buyerId: 'user_david',
    buyerName: 'David Eze',
    campusName: 'UNIZIK (Awka)',
    rating: 5,
    comment: 'The rechargeable fan is saving my life in Perm Site lodge with these power cuts. Works for 8 solid hours on low speed. Delivery was on time.',
    createdAt: '2026-10-12T14:30:00Z',
    verifiedPurchase: true
  },
  {
    id: 'rev_3',
    sellerId: 'user_emeka',
    sellerName: 'Emeka Campus Gadgets',
    buyerId: 'user_kemi',
    buyerName: 'Kemi Adebayo',
    campusName: 'UNIZIK (Awka)',
    rating: 4.8,
    comment: 'Super fast communication on WhatsApp. Came with original charger and tested immediately at Second Gate. Recommended!',
    createdAt: '2026-10-10T11:15:00Z',
    verifiedPurchase: true
  },
  {
    id: 'rev_4',
    sellerId: 'user_amara',
    sellerName: 'Amara Treats & Thrift',
    buyerId: 'user_chiamaka',
    buyerName: 'Chiamaka Okoli',
    campusName: 'UNIZIK (Awka)',
    rating: 5,
    comment: 'Delivered directly to my hostel door at Diamond Valley! The mini gas cylinder is clean, zero leaks, and came with regulator. Very reliable seller.',
    createdAt: '2026-10-13T16:00:00Z',
    verifiedPurchase: true
  },
  {
    id: 'rev_5',
    sellerId: 'user_tunde',
    sellerName: 'Akoka Tech Store',
    buyerId: 'user_segun',
    buyerName: 'Segun Balogun',
    campusName: 'UNILAG (Akoka)',
    rating: 5,
    comment: 'Met at New Hall arena. iPhone is spotless and factory unlocked. Handshake escrow gave me complete peace of mind.',
    createdAt: '2026-10-11T18:20:00Z',
    verifiedPurchase: true
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_hp_laptop',
    sellerId: 'user_emeka',
    sellerName: 'Emeka Campus Gadgets',
    sellerPhone: '+234 803 412 9081',
    sellerVerified: true,
    sellerRating: 4.9,
    sellerReviewCount: 38,
    campusId: 'unizik',
    campusName: 'Nnamdi Azikiwe University (UNIZIK)',
    title: 'HP EliteBook 840 G6 Core i5 (16GB RAM / 512GB SSD)',
    description: 'Clean UK-used HP EliteBook 840 G6. 8th Gen Intel Core i5 processor, 16GB DDR4 RAM, 512GB NVMe M.2 SSD, backlit keyboard, crisp FHD anti-glare screen. Battery lasts over 4 hours on lecture note taking and coding. Comes with original HP fast charger and laptop sleeve.',
    price: 185000,
    category: 'electronics',
    condition: 'used_like_new',
    images: [
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 2,
    deliveryOption: 'both',
    deliveryFee: 1000,
    pickupLandmark: 'Ifite First Gate, Opposite Peace Mass Logistics',
    status: 'approved',
    brand: 'HP',
    createdAt: '2026-10-10T10:00:00Z'
  },
  {
    id: 'prod_macbook_air',
    sellerId: 'user_tunde',
    sellerName: 'Akoka Tech Store',
    sellerPhone: '+234 802 771 9901',
    sellerVerified: true,
    sellerRating: 5.0,
    sellerReviewCount: 19,
    campusId: 'unilag',
    campusName: 'University of Lagos (UNILAG)',
    title: 'Apple MacBook Air M1 (8GB / 256GB SSD) Space Gray',
    description: 'Pristine condition MacBook Air M1. 94% battery health, zero dents, crystal clear retina display. Ideal for design, architecture, engineering and computer science students. Comes with original 30W USB-C brick and MagSafe/Type-C cable.',
    price: 495000,
    category: 'electronics',
    condition: 'used_like_new',
    images: [
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 1,
    deliveryOption: 'both',
    deliveryFee: 1500,
    pickupLandmark: 'UNILAG New Hall Shopping Arena, Akoka',
    status: 'approved',
    brand: 'Apple',
    createdAt: '2026-10-11T12:00:00Z'
  },
  {
    id: 'prod_rechargeable_fan',
    sellerId: 'user_emeka',
    sellerName: 'Emeka Campus Gadgets',
    sellerPhone: '+234 803 412 9081',
    sellerVerified: true,
    sellerRating: 4.9,
    sellerReviewCount: 38,
    campusId: 'unizik',
    campusName: 'Nnamdi Azikiwe University (UNIZIK)',
    title: 'Lontor 16-Inch Solar Rechargeable Standing Fan + Remote Control',
    description: 'Essential for surviving campus lodge heatwaves. Features dual high-capacity lithium battery bank, USB phone charging port, 3-speed brushless quiet motor, and LED night light. Runs 8 hours continuously on battery. Includes remote control and DC solar connector.',
    price: 38000,
    category: 'home',
    condition: 'new',
    images: [
      'https://images.unsplash.com/photo-1618941716939-553df3c6c278?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 5,
    deliveryOption: 'both',
    deliveryFee: 1200,
    pickupLandmark: 'Perm Site Student Lodges, Perm Site Gate',
    status: 'approved',
    brand: 'Lontor',
    createdAt: '2026-10-12T09:00:00Z'
  },
  {
    id: 'prod_camp_gas_cylinder',
    sellerId: 'user_amara',
    sellerName: 'Amara Treats & Thrift',
    sellerPhone: '+234 706 881 2304',
    sellerVerified: true,
    sellerRating: 4.8,
    sellerReviewCount: 24,
    campusId: 'unizik',
    campusName: 'Nnamdi Azikiwe University (UNIZIK)',
    title: '3kg Camping Gas Cylinder + Burner & Safety Valve',
    description: 'Compact 3kg student gas cylinder for hostel cooking. Inspected with zero leaks, pressure tested, comes with heavy-duty burner plate. Extremely portable and refilled ready to cook.',
    price: 18500,
    category: 'home',
    condition: 'used_like_new',
    images: [
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 3,
    deliveryOption: 'both',
    deliveryFee: 800,
    pickupLandmark: 'Amansea Junction, Beside Total Energy',
    status: 'approved',
    brand: 'Golden Lion',
    createdAt: '2026-10-12T14:00:00Z'
  },
  {
    id: 'prod_engineering_drawing_board',
    sellerId: 'user_emeka',
    sellerName: 'Emeka Campus Gadgets',
    sellerPhone: '+234 803 412 9081',
    sellerVerified: true,
    sellerRating: 4.9,
    sellerReviewCount: 38,
    campusId: 'unn',
    campusName: 'University of Nigeria, Nsukka (UNN)',
    title: 'A2 Technical Engineering Drawing Board + Drafting Set & T-Square',
    description: 'Mandatory standard A2 wooden board with steel parallel motion guide. Comes with Rotring set squares, drafting tape, French curves, and protective carrying bag. Passed engineering design exams with flying colours.',
    price: 24000,
    category: 'books',
    condition: 'used_good',
    images: [
      'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 1,
    deliveryOption: 'buyer_pickup',
    deliveryFee: 0,
    pickupLandmark: 'UNN Faculty of Engineering Pavilion, Nsukka',
    status: 'approved',
    brand: 'Standard Technical',
    createdAt: '2026-10-13T08:30:00Z'
  },
  {
    id: 'prod_vintage_denim_jacket',
    sellerId: 'user_amara',
    sellerName: 'Amara Treats & Thrift',
    sellerPhone: '+234 706 881 2304',
    sellerVerified: true,
    sellerRating: 4.8,
    sellerReviewCount: 24,
    campusId: 'oau',
    campusName: 'Obafemi Awolowo University (OAU)',
    title: 'Oversized Vintage Distressed Denim Jacket (Unisex L/XL)',
    description: 'Heavyweight authentic cotton wash denim jacket with brass buttons. Perfect for campus cool evenings, departmental dinners, and casual outings. In mint condition, washed and sanitized.',
    price: 14500,
    category: 'fashion',
    condition: 'used_like_new',
    images: [
      'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 1,
    deliveryOption: 'both',
    deliveryFee: 1000,
    pickupLandmark: 'OAU SUB Building Car Park, Ile-Ife',
    status: 'approved',
    brand: 'Thrift Curated',
    createdAt: '2026-10-13T11:00:00Z'
  },
  {
    id: 'prod_hostel_dorm_fridge',
    sellerId: 'user_tunde',
    sellerName: 'Akoka Tech Store',
    sellerPhone: '+234 802 771 9901',
    sellerVerified: true,
    sellerRating: 5.0,
    sellerReviewCount: 19,
    campusId: 'unilag',
    campusName: 'University of Lagos (UNILAG)',
    title: 'Hisense 45L Single Door Mini Bedside Fridge (Low Voltage)',
    description: 'Energy-saving compact bedside dorm fridge. Freezes water cubes and keeps soup, drinks, and groceries fresh. Works smoothly on student mini inverter setups. Silent operation.',
    price: 75000,
    category: 'home',
    condition: 'used_like_new',
    images: [
      'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 1,
    deliveryOption: 'both',
    deliveryFee: 2000,
    pickupLandmark: 'UNILAG Jaja Hall Gate, Akoka',
    status: 'approved',
    brand: 'Hisense',
    createdAt: '2026-10-13T13:30:00Z'
  },
  {
    id: 'prod_project_binding_printing',
    sellerId: 'user_emeka',
    sellerName: 'Emeka Campus Gadgets',
    sellerPhone: '+234 803 412 9081',
    sellerVerified: true,
    sellerRating: 4.9,
    sellerReviewCount: 38,
    campusId: 'futo',
    campusName: 'Federal University of Technology, Owerri (FUTO)',
    title: 'Final Year Project Hardcover Binding + Express Proofprinting',
    description: 'Gold embossed departmental hard-binding for BSc, MSc and HND final thesis. Includes quality 80gsm paper printing, plagiarism check review, and ribbon marker. Fast 24-hour delivery on campus.',
    price: 9500,
    category: 'services',
    condition: 'new',
    images: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 50,
    deliveryOption: 'seller_delivers',
    deliveryFee: 500,
    pickupLandmark: 'FUTO ICT Centre, Owerri',
    status: 'approved',
    brand: 'Express Campus Press',
    createdAt: '2026-10-14T07:00:00Z'
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'order_1001',
    orderNumber: 'AB-82914',
    buyerId: 'user_chiamaka',
    buyerName: 'Chiamaka Okoli',
    buyerPhone: '+234 814 559 8210',
    buyerHostel: 'Diamond Valley Hostel, Ifite',
    sellerId: 'user_emeka',
    sellerName: 'Emeka Campus Gadgets',
    campusId: 'unizik',
    campusName: 'Nnamdi Azikiwe University (UNIZIK)',
    items: [
      {
        productId: 'prod_rechargeable_fan',
        title: 'Lontor 16-Inch Solar Rechargeable Standing Fan + Remote Control',
        price: 38000,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1618941716939-553df3c6c278?auto=format&fit=crop&w=800&q=80'
      }
    ],
    subtotal: 38000,
    deliveryFee: 1200,
    gatewayFee: 670,
    totalAmount: 39870,
    platformCommission: 1140, // 3% of 38,000 (below 2,000 cap)
    sellerPayoutAmount: 38060, // 38,000 - 1,140 + 1,200
    fulfillmentType: 'seller_delivers',
    deliveryInstructions: 'Deliver to Diamond Valley Hostel Gate, Room 14',
    paymentMethod: 'card',
    paymentStatus: 'payout_released',
    otpHash: 'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592',
    otpSalt: 'abbason_salt_seed_1001',
    otpExpiresAt: Date.now() + 86400000,
    otpFailedAttempts: 0,
    status: 'delivered',
    deliveryOtpForBuyer: '482910',
    hasBuyerReviewed: true,
    createdAt: '2026-10-14T06:00:00Z',
    deliveredAt: '2026-10-14T07:45:00Z'
  }
];
