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
    icon: 'Laptop',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=65'
  },
  {
    id: 'fashion',
    name: 'Fashion & accessories',
    slug: 'fashion',
    subtitle: 'Wear it your way',
    icon: 'Shirt',
    imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=65'
  },
  {
    id: 'food',
    name: 'Food & groceries',
    slug: 'food',
    subtitle: 'Good things, close by',
    icon: 'ShoppingBasket',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=65'
  },
  {
    id: 'beauty',
    name: 'Beauty',
    slug: 'beauty',
    subtitle: 'Everyday care & beauty',
    icon: 'Sparkles',
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=65'
  },
  {
    id: 'books',
    name: 'Books & stationery',
    slug: 'books',
    subtitle: 'Study essentials',
    icon: 'BookOpen',
    imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=65'
  },
  {
    id: 'home',
    name: 'Home & dorm',
    slug: 'home',
    subtitle: 'Make your space yours',
    icon: 'Bed',
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=65'
  },
  {
    id: 'services',
    name: 'Services',
    slug: 'services',
    subtitle: 'People who can help',
    icon: 'Wrench',
    imageUrl: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=600&q=65'
  },
  {
    id: 'other',
    name: 'Other',
    slug: 'other',
    subtitle: 'A little bit of everything',
    icon: 'Briefcase',
    imageUrl: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=600&q=65'
  }
];

export const INITIAL_USERS: User[] = [];

export const INITIAL_SELLER_REVIEWS: SellerReview[] = [];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_ORDERS: Order[] = [];
