export type Role = 'student' | 'seller' | 'admin';

export type ProductCondition = 'new' | 'used_like_new' | 'used_good';

export type ProductStatus = 'pending_review' | 'approved' | 'rejected';

export type DeliveryOption = 'seller_delivers' | 'buyer_pickup' | 'both';

export type OrderStatus = 'paid_awaiting_delivery' | 'delivered' | 'disputed' | 'cancelled';

export type PaymentStatus = 'escrow_held' | 'payout_released' | 'refunded';

export type DisputeStatus = 'open' | 'resolved_refund' | 'resolved_payout';

export interface Campus {
  id: string;
  name: string;
  shortName: string;
  state: string;
  hostels: string[];
  safeMeetupPoints: string[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  subtitle: string;
  icon: string;
}

export interface SellerReview {
  id: string;
  sellerId: string;
  sellerName: string;
  orderId?: string;
  buyerId: string;
  buyerName: string;
  campusName: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
  verifiedPurchase: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  campusId: string;
  campusName: string;
  hostel: string;
  isVerifiedSeller?: boolean;
  sellerVerificationStatus?: 'not_applied' | 'pending' | 'verified' | 'rejected';
  storeName?: string;
  bio?: string;
  studentIdCardUrl?: string;
  matricNumber?: string;
  facultyDepartment?: string;
  level?: string;
  bankDetails?: {
    bankName: string;
    accountNumberMasked: string;
    accountName: string;
  };
  rating?: number;
  reviewsCount?: number;
  salesCount?: number;
}

export interface Product {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  sellerVerified: boolean;
  sellerRating?: number;
  sellerReviewCount?: number;
  campusId: string;
  campusName: string;
  title: string;
  description: string;
  price: number; // in Naira (₦)
  category: string;
  condition: ProductCondition;
  images: string[];
  stock: number;
  deliveryOption: DeliveryOption;
  deliveryFee: number; // in Naira (₦)
  pickupLandmark: string;
  status: ProductStatus;
  rejectionReason?: string;
  createdAt: string;
  brand?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  buyerHostel: string;
  sellerId: string;
  sellerName: string;
  campusId: string;
  campusName: string;
  items: {
    productId: string;
    title: string;
    price: number;
    quantity: number;
    image: string;
  }[];
  subtotal: number; // P
  deliveryFee: number; // D
  gatewayFee: number; // G (paid by buyer)
  totalAmount: number; // P + D + G
  platformCommission: number; // min(P * 0.03, 2000)
  sellerPayoutAmount: number; // P - platformCommission + D
  fulfillmentType: 'seller_delivers' | 'buyer_pickup';
  deliveryInstructions: string;
  paymentMethod: 'card' | 'bank_transfer' | 'ussd';
  paymentStatus: PaymentStatus;
  otpHash: string; // SHA-256 hash of (OTP + salt)
  otpSalt: string;
  otpExpiresAt: number;
  otpFailedAttempts: number;
  status: OrderStatus;
  deliveryOtpForBuyer?: string; // Plaintext OTP returned ONLY to the authenticated buyer!
  hasBuyerReviewed?: boolean;
  createdAt: string;
  deliveredAt?: string;
}

export interface Complaint {
  id: string;
  orderId: string;
  orderNumber: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  reason: string;
  description: string;
  status: DisputeStatus;
  resolutionNote?: string;
  createdAt: string;
}

export interface PayoutRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  sellerId: string;
  sellerName: string;
  bankName: string;
  accountNumberMasked: string;
  amount: number;
  commissionDeducted: number;
  status: 'queued' | 'confirmed' | 'failed';
  idempotencyKey: string;
  reference: string;
  initiatedAt: string;
  confirmedAt?: string;
}

export interface SellerVerificationRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  phone: string;
  campusId: string;
  campusName: string;
  matricNumber: string;
  facultyDepartment?: string;
  level?: string;
  hostelShopLocation?: string;
  idDocumentType?: string;
  idCardPhotoUrl: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  categoriesToSell?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  submittedAt: string;
}

export interface PlatformMetrics {
  totalGmv: number;
  platformCommissionCollected: number;
  pendingEscrowAmount: number;
  totalOrders: number;
  pendingListingsCount: number;
  activeListingsCount: number;
  verifiedSellersCount: number;
}
