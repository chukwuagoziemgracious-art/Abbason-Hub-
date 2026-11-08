export type Role = 'student' | 'seller' | 'admin';

export type ProductCondition = 'new' | 'used_like_new' | 'used_good';

export type ProductStatus = 'pending_review' | 'approved' | 'rejected';

export type DeliveryOption = 'seller_delivers' | 'buyer_pickup' | 'both';

export type OrderStatus =
  | 'awaiting_payment'
  | 'scheduled'
  | 'delivery_fee_paid'
  | 'in_transit'
  | 'delivered_pending_inspection'
  | 'partially_paid'
  | 'paid_completed'
  | 'paid_awaiting_delivery'
  | 'delivered'
  | 'disputed'
  | 'cancelled';

export type PaymentStatus =
  | 'delivery_fee_paid'
  | 'pending_inspection_pay'
  | 'partially_paid'
  | 'paid_completed'
  | 'escrow_held'
  | 'payout_released'
  | 'refunded';

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
  imageUrl?: string;
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

export interface SellerProfile {
  id: string;
  storeName: string;
  campusId: string;
  campusName: string;
  isVerifiedSeller: boolean;
  isSuspended?: boolean;
  subaccountVerified?: boolean;
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
  sellerVerificationStatus?: 'not_applied' | 'pending' | 'approved_pending_fee' | 'verified' | 'rejected' | 'removed';
  removedPermanently?: boolean;
  subaccountVerified?: boolean;
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
    bankCode?: string;
  };
  bannedUntilMs?: number;
  suspendedUntilMs?: number;
  subaccountCode?: string;
  rating?: number;
  reviewsCount?: number;
  salesCount?: number;
  hasSavedPhone?: boolean;
  sellerPhoneSaved?: boolean;
}

export type DeliveryScheduleType = 'within_3_days' | 'within_7_days' | 'specific_days';
export type DeliveryDayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type DeliveryTimeSlot = 'morning' | 'afternoon' | 'evening' | 'any';

export type FulfillmentOption = 'delivery' | 'pickup';

export interface PickupConfig {
  locationKind: 'safe_checkpoint' | 'custom';
  locationLabel: string;
  days: (number | DeliveryDayOfWeek)[]; // 0-6 or 'monday'-'sunday'
  timeSlot: string;
  timeNote?: string;
}

export interface DeliverySchedule {
  type: DeliveryScheduleType;
  days?: number[]; // (0 = Sunday, 1 = Monday, ... 6 = Saturday)
  specificDays?: DeliveryDayOfWeek[];
  timeSlot: DeliveryTimeSlot;
}

export interface Product {
  id: string;
  sellerId: string;
  sellerName: string;
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
  fulfillmentOptions?: FulfillmentOption[];
  pickup?: PickupConfig;
  deliveryFee: number; // in Naira (₦)
  pickupLandmark: string;
  status: ProductStatus;
  rejectionReason?: string;
  createdAt: string;
  brand?: string;
  deliverySchedule?: DeliverySchedule;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  id: string;
  itemCode: string; // e.g. "ITM-9A4B"
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
  status: 'pending_inspection' | 'paid' | 'rejected';
  paidAt?: string;
  paidAmount?: number;
  paymentReference?: string;
}

export interface OrderPartyContact {
  name: string;
  phone: string;
  location?: string;
  pickupLocation?: string;
  pickupDate?: string;
  timeSlot?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  buyerId: string;
  buyerName: string;
  buyerPhone?: string;
  buyerHostel: string;
  sellerId: string;
  sellerName: string;
  campusId: string;
  campusName: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  gatewayFee: number;
  totalAmount: number;
  upfrontDeliveryFee?: number;
  upfrontGatewayFee?: number;
  upfrontTotalPaid?: number;
  itemsTotalDueOnDelivery?: number;
  itemsTotalPaid?: number;
  deliveryFeePaid?: boolean;
  contactShared?: boolean;
  agreedTime?: string;
  cancelCutoffMs?: number;
  goodsDue?: number;
  goodsPaid?: number;
  commissionCollected?: number;
  platformCommission?: number;
  sellerPayoutAmount?: number;
  paymentMode?: string;
  fulfillmentType: 'seller_delivers' | 'buyer_pickup';
  fulfillmentMethod?: 'delivery' | 'pickup' | 'buyer_pickup' | 'seller_delivers';
  sellerPhone?: string;
  pickupLandmark?: string;
  deliveryInstructions: string;
  meetingPoint?: {
    kind: 'safe_checkpoint' | 'custom';
    label: string;
  };
  pickupDetails?: {
    locationKind: 'safe_checkpoint' | 'custom';
    locationLabel: string;
    pickupDate: string;
    timeSlot: string;
  };
  scheduledDate?: string;
  deliveryDeadlineMs?: number;
  contactRevealAtMs?: number;
  timeSlot?: 'morning' | 'afternoon' | 'evening' | 'any';
  paymentMethod: 'card' | 'bank_transfer' | 'ussd';
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  sellerDefault?: boolean;
  buyerReportedRefusal?: boolean;
  sellerUnreachableReported?: boolean;
  refund?: {
    owedAmount?: number;
    amountOwed?: number;
    multiplier?: number;
    status: 'owed' | 'paid_claimed' | 'confirmed' | 'disputed';
    dueAt?: number;
    bankAccount?: {
      bankName: string;
      accountNumber: string;
      accountName: string;
    };
    disputeReason?: string;
  };
  refundAccount?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  cancelReason?: 'buyer_cancelled' | 'seller_cancelled' | 'seller_unreachable' | string;
  buyerExplanation?: string;
  hasBuyerReviewed?: boolean;
  createdAt: string;
  deliveredAt?: string;
  completedAt?: string;
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
  bankCode?: string;
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
