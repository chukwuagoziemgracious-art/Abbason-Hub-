import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initializeApp as initAdminApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { initializeApp as initClientApp } from 'firebase/app';
import { 
  getFirestore as getClientFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  query, 
  where,
  runTransaction,
  increment
} from 'firebase/firestore';
import {
  VENDOR_FEE_EARLY,
  EARLY_VENDOR_LIMIT,
  VENDOR_FEE_STANDARD,
  COMMISSION_RATE,
  CANCEL_CUTOFF_HOURS,
  SELLER_GRACE_HOURS,
  BUYER_GHOST_GRACE_HOURS,
  BAN_DAYS,
  MAX_DELIVERY_DAYS,
  PENALTY_MULTIPLIER,
  MAX_OPEN_UNPAID_ORDERS,
  COLLECTION_WARN,
  COLLECTION_RED,
  calculateGatewayFee,
} from './shared/config.js';
import { NIGERIAN_BANKS } from './src/data/nigerianBanks.ts';

// Paystack Bank List Cache
let cachedPaystackBanks: any[] | null = null;
async function getPaystackBanks(): Promise<any[]> {
  if (cachedPaystackBanks && cachedPaystackBanks.length > 0) return cachedPaystackBanks;
  if (PAYMENTS_MODE !== 'demo') {
    try {
      const data = await paystackRequest('/bank');
      if (Array.isArray(data) && data.length > 0) {
        cachedPaystackBanks = data;
        return cachedPaystackBanks;
      }
    } catch (err: any) {
      console.warn('[Paystack] Bank list fetch notice, using fallback directory:', err.message);
    }
  }
  cachedPaystackBanks = NIGERIAN_BANKS.map((b) => ({ name: b.name, code: b.code, slug: b.id }));
  return cachedPaystackBanks;
}

function findBankCode(bankNameOrCode: string, bankList: any[]): string | null {
  if (!bankNameOrCode) return null;
  const directMatch = bankList.find((b) => b.code === bankNameOrCode);
  if (directMatch) return directMatch.code;

  const clean = bankNameOrCode.toLowerCase().replace(/[^a-z0-9]/g, '');
  const match = bankList.find((b) => {
    const bClean = (b.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return bClean === clean || bClean.includes(clean) || clean.includes(bClean);
  });
  return match ? match.code : null;
}

// Name comparison helper: requires at least 2 distinct matching name parts
function compareNames(sellerName: string, accountName: string): { matches: boolean; matchedParts: string[] } {
  const cleanTokens = (str: string) =>
    (str || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 2);

  const sellerTokens = cleanTokens(sellerName);
  const accountTokens = cleanTokens(accountName);

  const matched: string[] = [];
  for (const s of sellerTokens) {
    for (const a of accountTokens) {
      if (s === a || (s.length >= 4 && a.includes(s)) || (a.length >= 4 && s.includes(a))) {
        matched.push(s);
        break;
      }
    }
  }

  const uniqueMatched = Array.from(new Set(matched));
  return {
    matches: uniqueMatched.length >= 2,
    matchedParts: uniqueMatched
  };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read Firebase configuration
const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
let firebaseConfig: any = {};
if (fs.existsSync(configPath)) {
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    console.warn('[Server] Failed to read firebase-applet-config.json:', err);
  }
}

// 1. Firebase Admin Initialization (with credential detection)
let adminApp: any = null;
let adminDb: any = null;
let adminAuth: any = null;

try {
  let credentialOption = undefined;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      credentialOption = cert(sa);
    } catch {
      credentialOption = cert(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    }
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    credentialOption = applicationDefault();
  }

  adminApp = initAdminApp({
    projectId: firebaseConfig.projectId || 'concise-genre-3nj8s',
    ...(credentialOption ? { credential: credentialOption } : {})
  }, 'abbason-admin');

  adminDb = getAdminFirestore(adminApp, firebaseConfig.firestoreDatabaseId);
  adminAuth = getAdminAuth(adminApp);
  console.log('[Server] Firebase Admin initialized. Database ID:', firebaseConfig.firestoreDatabaseId);
} catch (err: any) {
  console.warn('[Server] Firebase Admin init notice:', err.message);
}

// 2. Client SDK fallback connection for read/writes when admin credentials not supplied
let clientDb: any = null;
try {
  if (firebaseConfig.apiKey) {
    const clientApp = initClientApp(firebaseConfig, 'abbason-client-server');
    clientDb = getClientFirestore(clientApp, firebaseConfig.firestoreDatabaseId);
  }
} catch (err: any) {
  console.warn('[Server] Client SDK init notice:', err.message);
}

// In-memory fast payment & order registry to ensure 100% demo sandbox reliability
interface PaymentRecord {
  reference: string;
  type: 'delivery_fee' | 'goods' | 'vendor_fee';
  orderId?: string;
  itemIds?: string[];
  sellerId?: string;
  amountKobo: number;
  amountNaira: number;
  goodsAmount?: number;
  deliveryFee?: number;
  commission?: number;
  gatewayFee: number;
  status: 'pending' | 'success' | 'failed';
  subaccountCode?: string;
  buyerUid?: string;
  createdAt: string;
  paidAt?: string;
}

const memoryPayments = new Map<string, PaymentRecord>();
const memoryOrders = new Map<string, any>();
const memoryBuyerContacts = new Map<string, any>();
const memorySellerContacts = new Map<string, any>();
const memorySellerPrivate = new Map<string, any>();
const memoryVerifications = new Map<string, any>();
const memoryComplaints = new Map<string, any>();
let memoryPaidVendorsCount = 0;

const isProduction = process.env.NODE_ENV === 'production';
const PAYSTACK_SECRET = (process.env.PAYSTACK_SECRET_KEY || 'sk_live_2560cdff157887cb716ca1ed6c4dceccf846be49').trim();
const getPaymentsMode = (): 'demo' | 'test' | 'live' | 'unconfigured' => {
  if (!PAYSTACK_SECRET) {
    if (isProduction) return 'unconfigured';
    return 'demo';
  }
  if (PAYSTACK_SECRET.startsWith('sk_live_')) return 'live';
  return 'test';
};

const PAYMENTS_MODE = getPaymentsMode();
console.log(`[Server] Payments engine initialized in mode: ${PAYMENTS_MODE.toUpperCase()}`);

async function restoreOrderStock(orderId: string, items: any[]): Promise<void> {
  if (!items || !Array.isArray(items) || items.length === 0) return;
  if (adminDb) {
    try {
      const orderRef = adminDb.collection('orders').doc(orderId);
      await adminDb.runTransaction(async (transaction: any) => {
        const orderDoc = await transaction.get(orderRef);
        if (!orderDoc.exists) return;
        const oData = orderDoc.data();
        if (oData.stockRestored) {
          console.log(`[Stock] Order ${orderId} stock was already restored. Skipping.`);
          return;
        }

        for (const item of items) {
          const qty = item.quantity || 1;
          const pId = item.productId || item.id;
          if (!pId) continue;
          const pRef = adminDb.collection('products').doc(pId);
          transaction.update(pRef, {
            stock: FieldValue.increment(qty)
          });
        }

        transaction.update(orderRef, {
          stockRestored: true,
          updatedAt: new Date().toISOString()
        });
      });
    } catch (err: any) {
      console.error(`[Stock] Error restoring stock for order ${orderId}:`, err.message);
      throw err;
    }
  } else if (PAYMENTS_MODE === 'demo') {
    const memOrder = memoryOrders.get(orderId);
    if (memOrder && !memOrder.stockRestored) {
      memOrder.stockRestored = true;
    }
  } else {
    throw new Error('Server storage is not ready: adminDb unavailable for stock restoration');
  }
}

async function getPaidVendorsCount(): Promise<number> {
  if (adminDb) {
    try {
      const snap = await adminDb.collection('counters').doc('vendors').get();
      if (snap.exists && typeof snap.data().paidCount === 'number') {
        return snap.data().paidCount;
      }
    } catch (err: any) {
      console.error('[Counters] Error reading vendor count:', err.message);
    }
  }
  return memoryPaidVendorsCount;
}

// Paystack REST API caller
async function paystackRequest(endpoint: string, method: string = 'GET', data?: any) {
  if (PAYMENTS_MODE === 'demo') {
    throw new Error('Paystack API is disabled in demo mode');
  }

  const response = await fetch(`https://api.paystack.co${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${PAYSTACK_SECRET}`,
      'Content-Type': 'application/json'
    },
    body: data ? JSON.stringify(data) : undefined
  });

  const json = await response.json();
  if (!response.ok || !json.status) {
    throw new Error(json.message || `Paystack request failed with status ${response.status}`);
  }
  return json.data;
}

// Unified Order Persistence Helper (Strictly Firestore Admin SDK in live/test modes)
async function getOrderFromStorage(orderId: string): Promise<any | null> {
  if (PAYMENTS_MODE === 'demo' && memoryOrders.has(orderId)) {
    return memoryOrders.get(orderId);
  }
  if (adminDb) {
    try {
      const snap = await adminDb.collection('orders').doc(orderId).get();
      if (snap.exists) return snap.data();
      return null;
    } catch (err: any) {
      console.error(`[Storage] adminDb getOrder error (${orderId}):`, err.message);
      throw err;
    }
  }
  if (PAYMENTS_MODE === 'demo') {
    return memoryOrders.get(orderId) || null;
  }
  throw new Error('Server storage is not ready: Firebase Admin credentials required');
}

async function saveOrderToStorage(orderId: string, orderData: any): Promise<void> {
  if (PAYMENTS_MODE === 'demo') {
    memoryOrders.set(orderId, orderData);
  }
  if (adminDb) {
    try {
      await adminDb.collection('orders').doc(orderId).set(orderData, { merge: true });
      return;
    } catch (err: any) {
      console.error(`[Storage] adminDb saveOrder error (${orderId}):`, err.message);
      throw err;
    }
  }
  if (PAYMENTS_MODE !== 'demo') {
    throw new Error('Server storage is not ready: Firebase Admin credentials required');
  }
}

async function saveBuyerContact(orderId: string, contact: { phone: string; name: string; location?: string }): Promise<void> {
  if (PAYMENTS_MODE === 'demo') {
    memoryBuyerContacts.set(orderId, { phone: contact.phone, name: contact.name });
  }
  if (adminDb) {
    try {
      await adminDb.collection('orders').doc(orderId).collection('contact').doc('buyer').set(contact);
      return;
    } catch (err: any) {
      console.error(`[Storage] adminDb saveBuyerContact error (${orderId}):`, err.message);
      throw err;
    }
  }
  if (PAYMENTS_MODE !== 'demo') {
    throw new Error('Server storage is not ready: Firebase Admin credentials required');
  }
}

async function getPaymentRecord(reference: string): Promise<PaymentRecord | null> {
  if (PAYMENTS_MODE === 'demo' && memoryPayments.has(reference)) {
    return memoryPayments.get(reference)!;
  }
  if (adminDb) {
    try {
      const snap = await adminDb.collection('payments').doc(reference).get();
      if (snap.exists) return snap.data() as PaymentRecord;
      return null;
    } catch (err: any) {
      console.error(`[Storage] adminDb getPaymentRecord error (${reference}):`, err.message);
      throw err;
    }
  }
  if (PAYMENTS_MODE === 'demo') {
    return memoryPayments.get(reference) || null;
  }
  throw new Error('Server storage is not ready: Firebase Admin credentials required');
}

async function savePaymentRecord(reference: string, record: PaymentRecord): Promise<void> {
  if (PAYMENTS_MODE === 'demo') {
    memoryPayments.set(reference, record);
  }
  if (adminDb) {
    try {
      await adminDb.collection('payments').doc(reference).set(record);
      return;
    } catch (err: any) {
      console.error(`[Storage] adminDb savePaymentRecord error (${reference}):`, err.message);
      throw err;
    }
  }
  if (PAYMENTS_MODE !== 'demo') {
    throw new Error('Server storage is not ready: Firebase Admin credentials required');
  }
}

// User Profile lookup
async function getUserProfile(userId: string): Promise<any | null> {
  if (adminDb) {
    try {
      const snap = await adminDb.collection('users').doc(userId).get();
      if (snap.exists) return snap.data();
      return null;
    } catch (err: any) {
      console.error(`[Storage] adminDb getUserProfile error (${userId}):`, err.message);
      throw err;
    }
  }
  if (PAYMENTS_MODE === 'demo') {
    return null;
  }
  throw new Error('Server storage is not ready: Firebase Admin credentials required');
}

// Seller Private subcollection lookup for payout subaccount
async function getSellerPrivate(sellerId: string): Promise<any | null> {
  if (adminDb) {
    try {
      const snap = await adminDb.collection('sellerPrivate').doc(sellerId).get();
      if (snap.exists) return snap.data();
      return null;
    } catch (err: any) {
      console.error(`[Storage] adminDb getSellerPrivate error (${sellerId}):`, err.message);
      throw err;
    }
  }
  if (PAYMENTS_MODE === 'demo') {
    return memorySellerPrivate.get(sellerId) || null;
  }
  throw new Error('Server storage is not ready: Firebase Admin credentials required');
}

// Idempotent Payment Success Handler with Paystack Verification & Firestore Transaction
async function handlePaymentSuccess(reference: string): Promise<{ success: boolean; message: string; order?: any }> {
  const payment = await getPaymentRecord(reference);
  if (!payment) {
    return { success: false, message: `Payment reference not found: ${reference}` };
  }

  if (payment.status === 'success') {
    return { success: true, message: 'Payment already processed' };
  }

  // 1. Verify with Paystack REST API in non-demo mode
  if (PAYMENTS_MODE !== 'demo') {
    try {
      const verifyData = await paystackRequest(`/transaction/verify/${reference}`);
      if (!verifyData || verifyData.status !== 'success') {
        console.error(`[Paystack Verify] Reference ${reference} failed status check:`, verifyData?.status);
        return { success: false, message: 'Paystack verification failed: payment not successful' };
      }
      if (verifyData.currency !== 'NGN') {
        console.error(`[Paystack Verify] Reference ${reference} currency mismatch:`, verifyData.currency);
        return { success: false, message: 'Paystack verification failed: currency is not NGN' };
      }
      if (verifyData.amount !== payment.amountKobo) {
        console.error(`[Paystack Verify] Reference ${reference} amount mismatch: expected ${payment.amountKobo}, got ${verifyData.amount}`);
        return { success: false, message: 'Paystack verification failed: amount mismatch' };
      }
    } catch (err: any) {
      console.error(`[Paystack Verify] Error verifying ${reference}:`, err.message);
      return { success: false, message: `Paystack verification error: ${err.message}` };
    }
  }

  // 2. Firestore Transaction for Idempotency: pending -> processing -> success
  if (adminDb) {
    const paymentRef = adminDb.collection('payments').doc(reference);
    try {
      return await adminDb.runTransaction(async (transaction: any) => {
        const pSnap = await transaction.get(paymentRef);
        if (!pSnap.exists) {
          return { success: false, message: 'Payment document missing in transaction' };
        }
        const currentP = pSnap.data();
        if (currentP.status === 'success') {
          return { success: true, message: 'Payment already processed' };
        }
        if (currentP.status === 'processing') {
          return { success: false, message: 'Payment is currently being processed' };
        }

        // Mark processing
        transaction.update(paymentRef, {
          status: 'processing',
          processingAt: new Date().toISOString()
        });

        let updatedOrder: any = null;

        // (a) Delivery Fee Payment
        if (payment.type === 'delivery_fee' && payment.orderId) {
          const orderRef = adminDb.collection('orders').doc(payment.orderId);
          const orderSnap = await transaction.get(orderRef);
          if (orderSnap.exists) {
            const order = orderSnap.data();
            order.deliveryFeePaid = true;
            order.upfrontTotalPaid = payment.amountNaira;
            order.status = 'scheduled';
            order.paymentStatus = 'delivery_fee_paid';
            order.contactShared = true;
            order.updatedAt = new Date().toISOString();
            transaction.set(orderRef, order, { merge: true });
            updatedOrder = order;
          }
        }

        // (b) Goods Payment at Handover
        if (payment.type === 'goods' && payment.orderId) {
          const orderRef = adminDb.collection('orders').doc(payment.orderId);
          const orderSnap = await transaction.get(orderRef);
          if (orderSnap.exists) {
            const order = orderSnap.data();
            const targetItemIds = new Set(payment.itemIds || []);
            let newlyPaidAmount = 0;

            order.items = order.items.map((item: any) => {
              if (targetItemIds.has(item.id) || targetItemIds.has(item.itemCode) || (!payment.itemIds || payment.itemIds.length === 0)) {
                // Mark ONLY items on the record that are still unpaid
                if (item.status === 'pending_inspection') {
                  item.status = 'paid';
                  item.paidAt = new Date().toISOString();
                  item.paidAmount = item.price * item.quantity;
                  item.paymentReference = reference;
                  newlyPaidAmount += item.paidAmount;
                }
              }
              return item;
            });

            // Use commission saved on the payment record
            const commissionNow = (typeof payment.commission === 'number') 
              ? payment.commission 
              : Math.round(newlyPaidAmount * COMMISSION_RATE);

            order.goodsPaid = (order.goodsPaid || 0) + newlyPaidAmount;
            order.commissionCollected = (order.commissionCollected || 0) + commissionNow;
            order.platformCommission = (order.platformCommission || 0) + commissionNow;
            order.sellerPayoutAmount = (order.sellerPayoutAmount || 0) + (newlyPaidAmount - commissionNow);

            const allItemsSettled = order.items.every((it: any) => it.status === 'paid' || it.status === 'rejected');
            if (allItemsSettled) {
              order.status = 'paid_completed';
              order.paymentStatus = 'paid_completed';
              order.completedAt = new Date().toISOString();
            } else {
              order.status = 'partially_paid';
              order.paymentStatus = 'partially_paid';
            }

            order.updatedAt = new Date().toISOString();
            transaction.set(orderRef, order, { merge: true });
            updatedOrder = order;
          }
        }

        // (c) Vendor Fee Payment
        if (payment.type === 'vendor_fee' && payment.sellerId) {
          const sellerId = payment.sellerId;
          const counterRef = adminDb.collection('counters').doc('vendors');
          transaction.set(counterRef, {
            paidCount: FieldValue.increment(1),
            lastUpdated: new Date().toISOString()
          }, { merge: true });

          const userRef = adminDb.collection('users').doc(sellerId);
          transaction.update(userRef, {
            isVerifiedSeller: true,
            sellerVerificationStatus: 'verified',
            verifiedAt: new Date().toISOString()
          });

          const profileRef = adminDb.collection('sellerProfiles').doc(sellerId);
          transaction.set(profileRef, {
            isVerifiedSeller: true,
            isSuspended: false
          }, { merge: true });
        }

        // Complete payment successfully
        transaction.update(paymentRef, {
          status: 'success',
          paidAt: new Date().toISOString()
        });

        return { success: true, message: 'Payment recorded and applied successfully', order: updatedOrder };
      });
    } catch (txErr: any) {
      console.error(`[Payment Transaction Error] Reference ${reference}:`, txErr);
      throw txErr;
    }
  }

  // Demo fallback
  payment.status = 'success';
  payment.paidAt = new Date().toISOString();
  await savePaymentRecord(reference, payment);
  return { success: true, message: 'Payment recorded successfully (demo)' };
}

// Background Task: Auto-settle overdue orders, release stock reservations, apply rules P2, P4, and P4b
async function runAutoSettleAndReservations() {
  const now = Date.now();
  console.log('[Server Task] Running auto-settle check and stock reservation sweep...');

  if (!adminDb) {
    if (PAYMENTS_MODE === 'demo') {
      for (const [orderId, order] of memoryOrders.entries()) {
        if (order.status === 'awaiting_payment' && !order.deliveryFeePaid) {
          const createdTime = new Date(order.createdAt).getTime() || 0;
          if (now - createdTime > 30 * 60 * 1000) {
            order.status = 'cancelled';
            order.cancelReason = 'unpaid_reservation_expired';
            order.updatedAt = new Date().toISOString();
            await saveOrderToStorage(orderId, order);
            await restoreOrderStock(orderId, order.items);
            console.log(`[Reservation] Released expired stock reservation for order: ${orderId}`);
          }
        }
      }
    }
    return;
  }

  try {
    // 1. Release unpaid delivery-fee reservations after 30 minutes
    const awaitingSnap = await adminDb.collection('orders').where('status', '==', 'awaiting_payment').get();
    for (const doc of awaitingSnap.docs) {
      const order = { id: doc.id, ...doc.data() };
      if (!order.deliveryFeePaid) {
        const createdTime = new Date(order.createdAt).getTime() || 0;
        if (now - createdTime > 30 * 60 * 1000) {
          await adminDb.collection('orders').doc(doc.id).update({
            status: 'cancelled',
            cancelReason: 'unpaid_reservation_expired',
            updatedAt: new Date().toISOString()
          });
          await restoreOrderStock(doc.id, order.items);
          console.log(`[Reservation] Released expired reservation for order: ${doc.id}`);
        }
      }
    }

    // 2. Process active orders ('scheduled' and 'in_transit') using single-field query to avoid composite indexes
    const activeSnap = await adminDb.collection('orders').where('status', 'in', ['scheduled', 'in_transit']).get();
    for (const doc of activeSnap.docs) {
      const order = { id: doc.id, ...doc.data() };
      const isPickupOrFree = (order.fulfillmentType === 'buyer_pickup' || (order.deliveryFee || 0) === 0);

      // Rule P4b: Buyer reported "Seller did not answer / did not show up" on pickup or free-delivery order
      if (isPickupOrFree && order.sellerUnreachableReported) {
        if (order.deliveryDeadlineMs && now >= order.deliveryDeadlineMs) {
          await adminDb.collection('orders').doc(order.id).update({
            status: 'cancelled',
            cancelReason: 'seller_unreachable',
            updatedAt: new Date().toISOString()
          });
          await restoreOrderStock(order.id, order.items);
          console.log(`[P4b] Order ${order.id} cancelled at deadline because seller was unreachable. No penalty applied.`);
          continue;
        }
      }

      // Rule P2: Delivery orders with a paid fee, seller does not deliver
      // 24 hours after the deadline, if the order is still unpaid-for and not rejected,
      // seller gets a strike (sellerDefault) and owes 2x delivery fee.
      // Server flags it and puts into admin queue; NEVER automatically suspends seller!
      if (!isPickupOrFree && order.deliveryFeePaid && (order.deliveryFee || 0) > 0) {
        const p2Deadline = (order.deliveryDeadlineMs || 0) + (SELLER_GRACE_HOURS * 3600 * 1000);
        if (order.deliveryDeadlineMs && now > p2Deadline) {
          const hasSellerReport = !!order.sellerReport || !!order.buyerReportedRefusal;
          if (!hasSellerReport && !order.sellerDefault) {
            const owedAmount = (order.deliveryFee || 0) * PENALTY_MULTIPLIER;
            await adminDb.collection('orders').doc(order.id).update({
              sellerDefault: true,
              refund: {
                owedAmount,
                multiplier: PENALTY_MULTIPLIER,
                status: 'owed',
                dueAt: now + (24 * 3600 * 1000)
              },
              updatedAt: new Date().toISOString()
            });

            // Add strike to seller profile/user
            if (order.sellerId) {
              try {
                await adminDb.collection('users').doc(order.sellerId).update({
                  strikes: FieldValue.increment(1)
                });
              } catch (uErr: any) {
                console.error(`[P2] Could not increment strikes on seller ${order.sellerId}:`, uErr.message);
              }
            }

            // Record in admin complaints queue for owner review
            const defaultDisputeId = `comp_p2_${order.id}`;
            await adminDb.collection('complaints').doc(defaultDisputeId).set({
              id: defaultDisputeId,
              orderId: order.id,
              orderNumber: order.orderNumber,
              buyerId: order.buyerId,
              buyerName: order.buyerName,
              sellerId: order.sellerId,
              sellerName: order.sellerName,
              reason: 'Seller Default: Non-Delivery After 24h Grace',
              description: `Order ${order.orderNumber} was not delivered within 24 hours of deadline. Seller owes 2x delivery fee (₦${owedAmount.toLocaleString()}) directly by bank transfer.`,
              type: 'seller_default_overdue',
              status: 'open',
              penaltyAmount: owedAmount,
              createdAt: new Date().toISOString()
            });
            console.log(`[P2] Flagged seller default for order: ${order.id}. Seller given 1 strike. Case logged to admin queue.`);
            continue;
          }
        }
      }

      // Rule P4: Pickup and free-delivery orders, buyer ghosts
      // 24 hours after the deadline, if order still scheduled with nothing paid, no item rejected,
      // not cancelled by buyer, NO seller report, and NO buyer complaint:
      // suspend BUYER for 30 days (bannedUntilMs), cancel order and restore stock.
      if (isPickupOrFree) {
        const p4Deadline = (order.deliveryDeadlineMs || 0) + (BUYER_GHOST_GRACE_HOURS * 3600 * 1000);
        if (order.deliveryDeadlineMs && now > p4Deadline) {
          const hasSellerReport = !!order.sellerReport || !!order.buyerReportedRefusal;
          const hasComplaint = !!order.complaintFiled;
          const hasPaidItems = (order.itemsTotalPaid || 0) > 0 || (order.items || []).some((i: any) => i.status === 'paid');
          const hasRejectedItems = (order.items || []).some((i: any) => i.status === 'rejected');

          if (!hasSellerReport && !hasComplaint && !hasPaidItems && !hasRejectedItems && order.status !== 'cancelled') {
            const bannedUntilMs = now + (BAN_DAYS * 24 * 3600 * 1000);
            if (order.buyerId) {
              try {
                await adminDb.collection('users').doc(order.buyerId).update({
                  bannedUntilMs,
                  isBanned: true,
                  banReason: `Ghosted pickup/free-delivery order ${order.orderNumber} past 24-hour grace.`
                });
              } catch (bErr: any) {
                console.error(`[P4] Could not set ban on buyer ${order.buyerId}:`, bErr.message);
              }
            }

            await adminDb.collection('orders').doc(order.id).update({
              status: 'cancelled',
              cancelReason: 'buyer_ghosted_auto_cancelled',
              updatedAt: new Date().toISOString()
            });
            await restoreOrderStock(order.id, order.items);

            // Log in admin queue
            const ghostId = `comp_p4_${order.id}`;
            await adminDb.collection('complaints').doc(ghostId).set({
              id: ghostId,
              orderId: order.id,
              orderNumber: order.orderNumber,
              buyerId: order.buyerId,
              buyerName: order.buyerName,
              sellerId: order.sellerId,
              sellerName: order.sellerName,
              reason: 'Buyer Ghosted (Auto 30-Day Suspension)',
              description: `Buyer suspended for 30 days for ghosting uncompleted pickup/free-delivery order ${order.orderNumber}.`,
              type: 'buyer_ghosted_auto_ban',
              status: 'open',
              bannedUntilMs,
              createdAt: new Date().toISOString()
            });
            console.log(`[P4] Buyer ${order.buyerId} suspended for 30 days due to ghosting order ${order.id}. Order cancelled and stock restored.`);
          }
        }
      }
    }
  } catch (err: any) {
    console.error('[Server Task] Error running runAutoSettleAndReservations:', err.message);
  }
}

async function startServer() {
  const app = express();
  // Environment requirement: Dev server must always run on port 3000
  const port = 3000;

  // JSON Body parser with raw body buffer for HMAC webhook signature verification
  app.use(express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    }
  }));

  // Logging & Standard Headers
  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Abbason-Environment', 'Production-Hardened');
    res.setHeader('X-Payment-Policy', 'Inspect-First-Pay-On-Delivery');
    res.setHeader('X-Payments-Mode', PAYMENTS_MODE);
    next();
  });

  // Auth Middleware (Strict token verification; no fake fallback in production or live/test modes)
  const requireAuth = async (req: any, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const token = authHeader.split('Bearer ')[1].trim();

    try {
      if (adminAuth) {
        const decoded = await adminAuth.verifyIdToken(token);
        req.user = decoded;

        // Check if user is suspended (exempt /api/me/ban-status and /api/me/ban-explanation)
        const isBanExempt = req.path === '/api/me/ban-status' || req.path === '/api/me/ban-explanation';
        if (!isBanExempt) {
          const userProfile = await getUserProfile(decoded.uid);
          if (userProfile?.bannedUntilMs && userProfile.bannedUntilMs > Date.now()) {
            const dateStr = new Date(userProfile.bannedUntilMs).toLocaleDateString('en-NG', { timeZone: 'Africa/Lagos' });
            return res.status(403).json({ error: `Your account is suspended until ${dateStr} due to a safety infraction.` });
          }
          if (userProfile?.isBanned) {
            return res.status(403).json({ error: 'Your account is suspended.' });
          }
        }
        return next();
      }
    } catch (err: any) {
      if (!isProduction && PAYMENTS_MODE === 'demo') {
        req.user = { uid: token.length > 10 ? token : 'demo_user_1', email: 'demo@abbasonhub.com' };
        return next();
      }
      return res.status(401).json({ error: 'Invalid or expired authentication session', details: err.message });
    }

    if (!isProduction && PAYMENTS_MODE === 'demo') {
      req.user = { uid: token, email: 'student@campus.edu.ng' };
      return next();
    }
    return res.status(401).json({ error: 'Firebase Admin authentication is required' });
  };

  // Storage verification middleware
  const requireStorage = (_req: Request, res: Response, next: NextFunction) => {
    if (PAYMENTS_MODE !== 'demo' && !adminDb) {
      return res.status(503).json({
        error: 'Server storage is not ready',
        message: 'Firebase Admin credentials (GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_KEY) are required for persistent server storage.'
      });
    }
    next();
  };

  // Owner admin middleware: requires chukwuagoziemgracious@gmail.com
  const requireOwnerAdmin = async (req: any, res: Response, next: NextFunction) => {
    await requireAuth(req, res, () => {
      const userEmail = (req.user?.email || '').toLowerCase().trim();
      const isOwner = userEmail === 'chukwuagoziemgracious@gmail.com';
      if (!isOwner) {
        return res.status(403).json({ error: 'Forbidden: Platform owner authorization required' });
      }
      next();
    });
  };

  // --- API Endpoints ---

  // 1. Config: returns active payment mode
  app.get('/api/config', (_req: Request, res: Response) => {
    res.json({
      paymentsMode: PAYMENTS_MODE,
      earlyVendorFee: VENDOR_FEE_EARLY,
      standardVendorFee: VENDOR_FEE_STANDARD,
      commissionRate: COMMISSION_RATE,
      serverTime: new Date().toISOString()
    });
  });

  // 2. Health Check
  app.get('/api/health', (_req: Request, res: Response) => {
    if (PAYMENTS_MODE !== 'demo' && !adminDb) {
      return res.status(503).json({
        status: 'error',
        error: 'Server storage is not ready',
        message: 'Google Cloud Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_KEY) are missing or failed to initialize adminDb.',
        paymentsMode: PAYMENTS_MODE,
        adminConnected: false
      });
    }
    res.json({
      status: 'ok',
      service: 'Abbason Hub Server Engine',
      version: '3.0.0',
      paymentsMode: PAYMENTS_MODE,
      adminConnected: !!adminDb,
      timestamp: new Date().toISOString()
    });
  });

  // 2b. Bank Directory
  app.get('/api/banks', async (_req: Request, res: Response) => {
    try {
      const banks = await getPaystackBanks();
      res.json({ success: true, banks });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve banks directory', details: err.message });
    }
  });

  // 3. Checkout Endpoint: Server-authoritative order creation and stock decrement
  app.post('/api/checkout', requireAuth, requireStorage, async (req: any, res: Response) => {
    try {
      const { items, sellerConfigs, buyerInfo } = req.body;
      const buyerUid = req.user.uid;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Cart items cannot be empty' });
      }

      // Verify buyer suspension status
      const buyerProfile = await getUserProfile(buyerUid);
      if (buyerProfile?.bannedUntilMs && buyerProfile.bannedUntilMs > Date.now()) {
        const dateStr = new Date(buyerProfile.bannedUntilMs).toLocaleDateString('en-NG', { timeZone: 'Africa/Lagos' });
        return res.status(403).json({ error: `Your account is suspended until ${dateStr} due to a safety infraction.` });
      }
      if (buyerProfile?.isBanned) {
        return res.status(403).json({ error: 'Your account is suspended.' });
      }

      // Validate buyer phone number strictly with Nigerian mobile format
      const rawPhone = (buyerInfo?.phone || req.body.phone || buyerProfile?.phone || '').trim().replace(/\s+/g, '');
      const phoneRegex = /^(\+234|0)[789][01]\d{8}$/;
      if (!phoneRegex.test(rawPhone)) {
        return res.status(400).json({ error: 'A valid Nigerian mobile number (+234... or 070/080/081/090/091...) is required to checkout.' });
      }

      const now = Date.now();
      const minDateMs = now - 60000;
      const maxDateMs = now + (MAX_DELIVERY_DAYS * 24 * 3600 * 1000) + (12 * 3600 * 1000);

      // Re-read each product from Firestore with admin SDK (ignore client price, deliveryFee, sellerId, etc.)
      interface ValidatedItem {
        productId: string;
        quantity: number;
        productDoc: any;
        sellerId: string;
      }
      const validatedItems: ValidatedItem[] = [];

      for (const rawItem of items) {
        const pId = rawItem.productId || rawItem.product?.id || rawItem.id;
        const qty = rawItem.quantity;

        if (!pId || typeof pId !== 'string') {
          return res.status(400).json({ error: 'Invalid product item format' });
        }
        if (!Number.isInteger(qty) || qty < 1) {
          return res.status(400).json({ error: 'Product quantity must be a whole number greater than 0' });
        }

        let pDoc: any = null;
        if (adminDb) {
          const pSnap = await adminDb.collection('products').doc(pId).get();
          if (pSnap.exists) {
            pDoc = { id: pSnap.id, ...pSnap.data() };
          }
        } else if (PAYMENTS_MODE === 'demo') {
          pDoc = rawItem.product || { id: pId, title: 'Demo Item', price: 1000, stock: 10, status: 'approved', sellerId: 'demo_seller_1' };
        }

        if (!pDoc) {
          return res.status(400).json({ error: `Product not found (ID: ${pId})` });
        }

        if (pDoc.status !== 'approved') {
          return res.status(400).json({ error: `Product "${pDoc.title}" is not available for purchase (status: ${pDoc.status}).` });
        }

        if (typeof pDoc.stock === 'number' && pDoc.stock < qty) {
          return res.status(400).json({ error: `Insufficient stock for "${pDoc.title}" (available: ${pDoc.stock}, requested: ${qty}).` });
        }

        validatedItems.push({
          productId: pId,
          quantity: qty,
          productDoc: pDoc,
          sellerId: pDoc.sellerId
        });
      }

      // Group validated items by authoritative product.sellerId
      const sellerGroups = new Map<string, ValidatedItem[]>();
      for (const vItem of validatedItems) {
        if (!sellerGroups.has(vItem.sellerId)) {
          sellerGroups.set(vItem.sellerId, []);
        }
        sellerGroups.get(vItem.sellerId)!.push(vItem);
      }

      // Verify each seller status (verified, unsuspended), phone, and fulfillment options
      let newUnpaidPickupOrdersCount = 0;
      const sellerPhoneMap = new Map<string, string>();

      for (const [sellerId, vList] of sellerGroups.entries()) {
        const sellerUser = await getUserProfile(sellerId);
        let sellerProfile: any = null;
        if (adminDb) {
          const profSnap = await adminDb.collection('sellerProfiles').doc(sellerId).get();
          if (profSnap.exists) sellerProfile = profSnap.data();
        }

        const isVerified = (sellerUser?.isVerifiedSeller === true || sellerUser?.sellerVerificationStatus === 'verified');
        if (!isVerified) {
          return res.status(400).json({ error: `Seller for "${vList[0].productDoc.title}" is not a verified seller.` });
        }

        const isSuspended = sellerProfile?.isSuspended === true || (sellerUser?.suspendedUntilMs && sellerUser.suspendedUntilMs > now);
        if (isSuspended) {
          return res.status(400).json({ error: `Seller for "${vList[0].productDoc.title}" is currently suspended.` });
        }

        // Require saved Nigerian mobile number on sellerPrivate/{sellerId}
        const priv = await getSellerPrivate(sellerId);
        const sPhone = (priv?.phone || '').trim();
        if (PAYMENTS_MODE !== 'demo' && !sPhone) {
          return res.status(400).json({
            error: `Seller "${sellerUser?.storeName || sellerUser?.name || 'Vendor'}" has not saved their Nigerian mobile number yet. Order cannot be placed until the seller saves their phone.`
          });
        }
        sellerPhoneMap.set(sellerId, sPhone || '08012345678');

        // Check scheduled date and fulfillment
        const config = (sellerConfigs && sellerConfigs[sellerId]) || {};
        const fulfillmentType = config.fulfillmentType === 'buyer_pickup' ? 'buyer_pickup' : 'seller_delivers';

        // Check against listing allowed fulfillment options
        for (const item of vList) {
          const allowedOpts = item.productDoc.fulfillmentOptions || 
            (item.productDoc.deliveryOption === 'both' 
              ? ['delivery', 'pickup'] 
              : [item.productDoc.deliveryOption === 'buyer_pickup' ? 'pickup' : 'delivery']);
          const requestedMethod = fulfillmentType === 'buyer_pickup' ? 'pickup' : 'delivery';
          if (!allowedOpts.includes(requestedMethod)) {
            return res.status(400).json({
              error: `Product "${item.productDoc.title}" does not support ${requestedMethod}. Allowed methods: ${allowedOpts.join(', ')}.`
            });
          }
        }

        const deliveryFee = fulfillmentType === 'seller_delivers' 
          ? Math.max(...vList.map((i) => i.productDoc.deliveryFee || 0)) 
          : 0;

        if (fulfillmentType === 'buyer_pickup' || deliveryFee === 0) {
          newUnpaidPickupOrdersCount++;
        }

        if (config.scheduledDate) {
          const chosenDate = new Date(config.scheduledDate);
          const chosenDateMs = chosenDate.getTime();
          if (isNaN(chosenDateMs) || chosenDateMs < minDateMs || chosenDateMs > maxDateMs) {
            return res.status(400).json({ error: 'Scheduled date for seller order must be within the next 7 days.' });
          }

          // If listing has pickup days, ensure chosen day of week matches (supports string and numeric days)
          if (fulfillmentType === 'buyer_pickup') {
            const dayOfWeek = chosenDate.getDay();
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const chosenDayName = dayNames[dayOfWeek];
            for (const item of vList) {
              if (item.productDoc.pickup?.days && Array.isArray(item.productDoc.pickup.days) && item.productDoc.pickup.days.length > 0) {
                const normalizedDays = item.productDoc.pickup.days.map((d: any) => String(d).toLowerCase());
                if (!normalizedDays.includes(chosenDayName) && !item.productDoc.pickup.days.includes(dayOfWeek)) {
                  return res.status(400).json({ error: `Chosen pickup date does not match available pickup days for "${item.productDoc.title}".` });
                }
              }
            }
          }
        }
      }

      // Enforce Rule P5: MAX_OPEN_UNPAID_ORDERS = 2 for pickup / free-delivery
      if (newUnpaidPickupOrdersCount > 0 && adminDb) {
        const existingOrdersSnap = await adminDb.collection('orders')
          .where('buyerId', '==', buyerUid)
          .where('status', '==', 'scheduled')
          .get();

        let openUnpaidCount = 0;
        existingOrdersSnap.forEach((doc: any) => {
          const o = doc.data();
          const isPickupOrFree = (o.fulfillmentType === 'buyer_pickup' || o.deliveryFee === 0);
          const isUnpaid = (!o.goodsPaid || o.goodsPaid === 0);
          if (isPickupOrFree && isUnpaid) {
            openUnpaidCount++;
          }
        });

        if (openUnpaidCount + newUnpaidPickupOrdersCount > MAX_OPEN_UNPAID_ORDERS) {
          return res.status(400).json({
            error: `You already have ${openUnpaidCount} open unpaid pickup/free-delivery order(s). Rule P5 limits you to a maximum of ${MAX_OPEN_UNPAID_ORDERS} open unpaid orders at a time. Please collect and inspect your existing orders first.`
          });
        }
      }

      // Atomically decrement stock and persist orders in Firestore transaction
      const createdOrders: any[] = [];

      if (adminDb) {
        await adminDb.runTransaction(async (transaction: any) => {
          // Re-verify stock in transaction
          for (const vItem of validatedItems) {
            const pRef = adminDb.collection('products').doc(vItem.productId);
            const pSnap = await transaction.get(pRef);
            if (!pSnap.exists) {
              throw new Error(`Product ${vItem.productId} was removed during checkout.`);
            }
            const pData = pSnap.data();
            if (typeof pData.stock === 'number' && pData.stock < vItem.quantity) {
              throw new Error(`Insufficient stock for "${pData.title}" during checkout.`);
            }
            transaction.update(pRef, {
              stock: FieldValue.increment(-vItem.quantity)
            });
          }

          // Build and write orders in transaction
          for (const [sellerId, vList] of sellerGroups.entries()) {
            const config = (sellerConfigs && sellerConfigs[sellerId]) || {};
            const fulfillmentType = config.fulfillmentType === 'buyer_pickup' ? 'buyer_pickup' : 'seller_delivers';
            const meetingPoint = config.meetingPoint || { kind: 'safe_checkpoint', label: 'Campus Main Gate' };
            const deliveryLocation = config.meetingPointKind === 'custom' 
              ? (config.customLocation || buyerInfo?.hostel || 'Campus Hostel') 
              : (meetingPoint.label || 'Campus Safe Checkpoint');
            const timeSlot = config.timeSlot || 'afternoon';

            const subtotal = vList.reduce((acc, it) => acc + (it.productDoc.price * it.quantity), 0);
            const deliveryFee = fulfillmentType === 'seller_delivers' 
              ? Math.max(...vList.map((i) => i.productDoc.deliveryFee || 0)) 
              : 0;

            const upfrontGatewayFee = calculateGatewayFee(deliveryFee);
            const upfrontTotalDue = deliveryFee + upfrontGatewayFee;
            const platformCommission = Math.round(subtotal * COMMISSION_RATE);
            const sellerPayoutAmount = subtotal - platformCommission;

            let deadlineDays = 7;
            const deliveryDeadlineMs = config.scheduledDate 
              ? new Date(config.scheduledDate).getTime() + (23 * 3600 * 1000 + 59 * 60 * 1000)
              : now + (deadlineDays * 24 * 3600 * 1000);
            
            const cancelCutoffMs = deliveryDeadlineMs - (CANCEL_CUTOFF_HOURS * 3600 * 1000);
            const isCommittedImmediately = (fulfillmentType === 'buyer_pickup' || deliveryFee === 0);

            const orderId = `ord_${crypto.randomBytes(6).toString('hex')}`;
            const orderNumber = `AB-${Math.floor(100000 + Math.random() * 900000)}`;

            const orderItems = vList.map((it) => ({
              id: `itm_${crypto.randomBytes(5).toString('hex')}`,
              itemCode: `ITM-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
              productId: it.productId,
              title: it.productDoc.title,
              price: it.productDoc.price,
              quantity: it.quantity,
              image: it.productDoc.images?.[0] || '',
              status: 'pending_inspection'
            }));

            const pickupDetails = fulfillmentType === 'buyer_pickup' ? {
              locationKind: vList[0].productDoc.pickup?.locationKind || 'safe_checkpoint',
              locationLabel: vList[0].productDoc.pickup?.locationLabel || vList[0].productDoc.pickupLandmark || 'Campus Meeting Point',
              pickupDate: config.scheduledDate || new Date(deliveryDeadlineMs).toISOString(),
              timeSlot: config.timeSlot || vList[0].productDoc.pickup?.timeSlot || 'any'
            } : undefined;

            const newOrder: any = {
              id: orderId,
              orderNumber,
              buyerId: buyerUid,
              buyerName: buyerInfo?.name || req.user.name || 'Campus Student',
              buyerHostel: buyerInfo?.hostel || 'Campus Hostel',
              sellerId,
              sellerName: vList[0].productDoc.sellerName || 'Verified Merchant',
              campusId: buyerInfo?.campusId || vList[0].productDoc.campusId || 'all',
              campusName: buyerInfo?.campusName || vList[0].productDoc.campusName || 'Campus Hub',
              items: orderItems,
              subtotal,
              deliveryFee,
              gatewayFee: upfrontGatewayFee,
              totalAmount: upfrontTotalDue + subtotal,
              upfrontDeliveryFee: deliveryFee,
              upfrontGatewayFee,
              upfrontTotalPaid: 0,
              itemsTotalDueOnDelivery: subtotal,
              itemsTotalPaid: 0,
              deliveryFeePaid: deliveryFee === 0,
              goodsDue: subtotal,
              goodsPaid: 0,
              commissionCollected: 0,
              platformCommission,
              sellerPayoutAmount,
              paymentMode: 'inspect_and_pay',
              fulfillmentType,
              deliveryInstructions: config.deliveryInstructions || deliveryLocation,
              meetingPoint,
              pickupDetails,
              scheduledDate: config.scheduledDate || new Date(deliveryDeadlineMs).toISOString(),
              deliveryDeadlineMs,
              cancelCutoffMs,
              contactShared: isCommittedImmediately,
              timeSlot,
              paymentMethod: 'card',
              paymentStatus: deliveryFee === 0 ? 'delivery_fee_paid' : 'pending_inspection_pay',
              status: deliveryFee === 0 ? 'scheduled' : 'awaiting_payment',
              stockRestored: false,
              createdAt: new Date().toISOString()
            };

            const orderRef = adminDb.collection('orders').doc(orderId);
            transaction.set(orderRef, newOrder);

            const buyerContactRef = orderRef.collection('contact').doc('buyer');
            transaction.set(buyerContactRef, {
              name: buyerInfo?.name || req.user.name || 'Campus Student',
              phone: rawPhone,
              location: deliveryLocation
            });

            const sellerContactRef = orderRef.collection('contact').doc('seller');
            transaction.set(sellerContactRef, {
              name: vList[0].productDoc.sellerName || 'Verified Merchant',
              phone: sellerPhoneMap.get(sellerId) || '08000000000',
              pickupLocation: vList[0].productDoc.pickup?.locationLabel || vList[0].productDoc.pickupLandmark || 'Campus Meeting Point',
              pickupDate: config.scheduledDate || new Date(deliveryDeadlineMs).toISOString(),
              timeSlot: config.timeSlot || vList[0].productDoc.pickup?.timeSlot || 'any'
            });

            createdOrders.push(newOrder);
          }
        });
      } else {
        // Demo mode local creation
        for (const [sellerId, vList] of sellerGroups.entries()) {
          const config = (sellerConfigs && sellerConfigs[sellerId]) || {};
          const fulfillmentType = config.fulfillmentType === 'buyer_pickup' ? 'buyer_pickup' : 'seller_delivers';
          const deliveryFee = fulfillmentType === 'seller_delivers' 
            ? Math.max(...vList.map((i) => i.productDoc.deliveryFee || 0)) 
            : 0;
          const subtotal = vList.reduce((acc, it) => acc + (it.productDoc.price * it.quantity), 0);
          const upfrontGatewayFee = calculateGatewayFee(deliveryFee);
          const orderId = `ord_${crypto.randomBytes(6).toString('hex')}`;
          const orderNumber = `AB-${Math.floor(100000 + Math.random() * 900000)}`;

          const newOrder: any = {
            id: orderId,
            orderNumber,
            buyerId: buyerUid,
            buyerName: buyerInfo?.name || 'Campus Student',
            sellerId,
            sellerName: vList[0].productDoc.sellerName || 'Verified Merchant',
            items: vList.map((it) => ({
              id: `itm_${crypto.randomBytes(5).toString('hex')}`,
              itemCode: `ITM-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
              productId: it.productId,
              title: it.productDoc.title,
              price: it.productDoc.price,
              quantity: it.quantity,
              image: it.productDoc.images?.[0] || '',
              status: 'pending_inspection'
            })),
            subtotal,
            deliveryFee,
            gatewayFee: upfrontGatewayFee,
            totalAmount: deliveryFee + upfrontGatewayFee + subtotal,
            deliveryFeePaid: deliveryFee === 0,
            goodsDue: subtotal,
            goodsPaid: 0,
            status: deliveryFee === 0 ? 'scheduled' : 'awaiting_payment',
            contactShared: deliveryFee === 0,
            stockRestored: false,
            createdAt: new Date().toISOString()
          };
          memoryOrders.set(orderId, newOrder);
          memoryBuyerContacts.set(orderId, {
            name: buyerInfo?.name || 'Campus Student',
            phone: rawPhone,
            location: config.deliveryInstructions || 'Campus Safe Checkpoint'
          });
          memorySellerContacts.set(orderId, {
            name: vList[0].productDoc.sellerName || 'Verified Merchant',
            phone: sellerPhoneMap.get(sellerId) || '08012345678',
            pickupLocation: vList[0].productDoc.pickupLandmark || 'Campus Meeting Point'
          });
          createdOrders.push(newOrder);
        }
      }

      res.json({
        success: true,
        orders: createdOrders,
        message: 'Order created successfully. Ready for inspection on delivery.'
      });
    } catch (err: any) {
      console.error('[Checkout Error]:', err);
      res.status(500).json({ error: err.message || 'Checkout failed' });
    }
  });

  // 4. Initialize Payment: Paystack Checkout or Demo Sandbox Generator
  app.post('/api/payments/initialize', requireAuth, requireStorage, async (req: any, res: Response) => {
    try {
      const { type, orderId, itemIds, all } = req.body;
      const appBaseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.get('host')}`;

      let amountNaira = 0;
      let deliveryFee = 0;
      let goodsAmount = 0;
      let commission = 0;
      let gatewayFee = 0;
      let targetOrder: any = null;
      let targetSellerId: string | undefined;
      let subaccountCode: string | undefined;
      let selectedItemIds: string[] = [];

      if (type === 'delivery_fee') {
        if (!orderId) return res.status(400).json({ error: 'orderId is required for delivery fee payment' });
        targetOrder = await getOrderFromStorage(orderId);
        if (!targetOrder) return res.status(404).json({ error: 'Order not found' });

        // Caller must be the order's buyerId
        if (targetOrder.buyerId !== req.user.uid) {
          return res.status(403).json({ error: 'Unauthorized: Only the buyer can pay for this order' });
        }

        // delivery_fee only when awaiting_payment and not already paid
        if (targetOrder.status !== 'awaiting_payment' || targetOrder.deliveryFeePaid) {
          return res.status(400).json({ error: 'Delivery fee has already been paid or order is not awaiting payment' });
        }

        deliveryFee = targetOrder.deliveryFee || 0;
        if (deliveryFee <= 0) {
          return res.status(400).json({ error: 'This order has no delivery fee to pay' });
        }

        gatewayFee = calculateGatewayFee(deliveryFee);
        amountNaira = deliveryFee + gatewayFee;
        targetSellerId = targetOrder.sellerId;

        // Subaccount check: read sellerPrivate/{sellerId} strictly from server order
        const sellerPriv = await getSellerPrivate(targetSellerId!);
        if (!sellerPriv?.subaccountCode) {
          return res.status(400).json({ error: "This seller's payouts are not set up yet" });
        }
        subaccountCode = sellerPriv.subaccountCode;

      } else if (type === 'goods') {
        if (!orderId) return res.status(400).json({ error: 'orderId is required for goods payment' });
        targetOrder = await getOrderFromStorage(orderId);
        if (!targetOrder) return res.status(404).json({ error: 'Order not found' });

        // Caller must be the order's buyerId
        if (targetOrder.buyerId !== req.user.uid) {
          return res.status(403).json({ error: 'Unauthorized: Only the buyer can pay for this order' });
        }

        // Goods payment only allowed when scheduled, in_transit, or partially_paid
        const validStatuses = ['scheduled', 'in_transit', 'partially_paid'];
        if (!validStatuses.includes(targetOrder.status)) {
          return res.status(400).json({ error: `Cannot pay for goods when order status is "${targetOrder.status}"` });
        }

        // itemIds is required (or all: true), never "empty means everything"
        if (!all && (!Array.isArray(itemIds) || itemIds.length === 0)) {
          return res.status(400).json({ error: 'itemIds is required (or all: true for all remaining items)' });
        }

        let targetItems: any[] = [];
        if (all) {
          targetItems = (targetOrder.items || []).filter((it: any) => it.status === 'pending_inspection');
        } else {
          const idSet = new Set(itemIds);
          for (const it of targetOrder.items || []) {
            if (idSet.has(it.id) || idSet.has(it.itemCode)) {
              if (it.status !== 'pending_inspection') {
                return res.status(400).json({ error: `Item "${it.title}" is already ${it.status} and cannot be paid again.` });
              }
              targetItems.push(it);
            }
          }
        }

        if (targetItems.length === 0) {
          return res.status(400).json({ error: 'No unpaid items pending inspection selected for payment' });
        }

        selectedItemIds = targetItems.map((it: any) => it.id);
        goodsAmount = targetItems.reduce((sum: number, it: any) => sum + (it.price * it.quantity), 0);
        commission = Math.round(goodsAmount * COMMISSION_RATE);
        gatewayFee = calculateGatewayFee(goodsAmount);
        amountNaira = goodsAmount + gatewayFee;
        targetSellerId = targetOrder.sellerId;

        // Subaccount check: read sellerPrivate/{sellerId} strictly from server order
        const sellerPriv = await getSellerPrivate(targetSellerId!);
        if (!sellerPriv?.subaccountCode) {
          return res.status(400).json({ error: "This seller's payouts are not set up yet" });
        }
        subaccountCode = sellerPriv.subaccountCode;

      } else if (type === 'vendor_fee') {
        // No subaccount at all, sellerId = req.user.uid, and only allowed when user status is approved_pending_fee
        targetSellerId = req.user.uid;
        const userDoc = await getUserProfile(targetSellerId!);
        if (userDoc?.sellerVerificationStatus !== 'approved_pending_fee') {
          return res.status(400).json({ error: 'Vendor fee is only allowed for approved sellers pending fee payment' });
        }

        const paidCount = await getPaidVendorsCount();
        const currentVendorFee = paidCount < EARLY_VENDOR_LIMIT ? VENDOR_FEE_EARLY : VENDOR_FEE_STANDARD;
        gatewayFee = calculateGatewayFee(currentVendorFee);
        amountNaira = currentVendorFee + gatewayFee;
      } else {
        return res.status(400).json({ error: `Invalid payment type: ${type}` });
      }

      const reference = `ABPAY_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
      const amountKobo = Math.round(amountNaira * 100);

      // Save payment intent
      const paymentRecord: PaymentRecord = {
        reference,
        type,
        orderId,
        itemIds: selectedItemIds,
        sellerId: targetSellerId,
        amountKobo,
        amountNaira,
        goodsAmount,
        deliveryFee,
        commission,
        gatewayFee,
        subaccountCode,
        status: 'pending',
        buyerUid: req.user.uid,
        createdAt: new Date().toISOString()
      };

      await savePaymentRecord(reference, paymentRecord);

      // 1. DEMO MODE
      if (PAYMENTS_MODE === 'demo') {
        const demoAuthUrl = `${appBaseUrl}/api/payments/demo-pay?reference=${reference}`;
        return res.json({
          status: true,
          paymentsMode: 'demo',
          reference,
          authorization_url: demoAuthUrl,
          amount: amountNaira
        });
      }

      // 2. LIVE / TEST MODE: Real Paystack API call
      const callback_url = `${appBaseUrl}/api/payments/verify?reference=${reference}`;
      const paystackPayload: any = {
        email: req.user.email || 'student@campus.edu.ng',
        amount: amountKobo,
        reference,
        callback_url,
        metadata: {
          reference,
          orderId,
          type,
          buyerUid: req.user.uid
        }
      };

      // Split payout: for delivery_fee and goods, subaccountCode is guaranteed
      if (subaccountCode) {
        paystackPayload.subaccount = subaccountCode;
        paystackPayload.bearer = 'account';
        if (type === 'delivery_fee') {
          paystackPayload.transaction_charge = Math.round(gatewayFee * 100);
        } else if (type === 'goods') {
          paystackPayload.transaction_charge = Math.round((commission + gatewayFee) * 100);
        }
      }

      const paystackData = await paystackRequest('/transaction/initialize', 'POST', paystackPayload);

      res.json({
        status: true,
        paymentsMode: PAYMENTS_MODE,
        reference,
        authorization_url: paystackData.authorization_url,
        access_code: paystackData.access_code
      });
    } catch (err: any) {
      console.error('[Paystack Init Error]:', err);
      const errMsg = (err.message || '').toLowerCase();
      const isLimitOrAccountError = errMsg.includes('limit') || errMsg.includes('starter') || errMsg.includes('account') || errMsg.includes('threshold') || errMsg.includes('restricted') || errMsg.includes('disabled');

      if (adminDb) {
        try {
          const alertId = `pay_alert_${Date.now()}`;
          await adminDb.collection('complaints').doc(alertId).set({
            id: alertId,
            reason: isLimitOrAccountError ? 'Paystack Account Limit / Gateway Threshold Error' : 'Payment Initialize Error',
            description: `Payment initialization failed: ${err.message}`,
            type: 'gateway_alert',
            status: 'open',
            errorDetails: err.message,
            createdAt: new Date().toISOString()
          });
        } catch {}
      }

      const clientMsg = isLimitOrAccountError
        ? 'Payments are temporarily unavailable'
        : (err.message || 'Payment initialization temporarily unavailable');

      res.status(500).json({ error: clientMsg });
    }
  });

  // 5. Verify Target Callback & Idempotent Success Execution
  app.get('/api/payments/verify', async (req: Request, res: Response) => {
    const reference = (req.query.reference as string || '').trim();
    if (!reference) {
      return res.redirect('/?payment_error=missing_reference');
    }

    try {
      if (PAYMENTS_MODE !== 'demo') {
        // Query Paystack verify endpoint
        const verifyData = await paystackRequest(`/transaction/verify/${reference}`);
        if (verifyData.status !== 'success') {
          return res.redirect(`/?payment_error=unsuccessful&reference=${reference}`);
        }
      }

      const result = await handlePaymentSuccess(reference);
      const orderIdParam = result.order?.id ? `&orderId=${result.order.id}` : '';
      res.redirect(`/?payment_status=success&reference=${reference}${orderIdParam}`);
    } catch (err: any) {
      console.error('[Payment Verify Error]:', err);
      res.redirect(`/?payment_error=${encodeURIComponent(err.message)}`);
    }
  });

  // 6. Paystack Webhook (HMAC SHA-512 Signature Verified)
  app.post('/api/paystack/webhook', async (req: any, res: Response) => {
    try {
      const signature = req.headers['x-paystack-signature'];
      if (!signature) {
        return res.status(401).send('No signature provided');
      }

      if (PAYSTACK_SECRET) {
        const hash = crypto
          .createHmac('sha512', PAYSTACK_SECRET)
          .update(req.rawBody || JSON.stringify(req.body))
          .digest('hex');

        if (hash !== signature) {
          console.warn('[Webhook] Signature mismatch');
          return res.status(401).send('Invalid signature');
        }
      }

      const event = req.body;
      if (event?.event === 'charge.success') {
        const reference = event.data?.reference;
        if (reference) {
          console.log(`[Webhook] Processing verified charge.success for reference: ${reference}`);
          await handlePaymentSuccess(reference);
        }
      }

      res.status(200).json({ status: true });
    } catch (err: any) {
      console.error('[Webhook Error]:', err);
      res.status(500).send('Webhook internal error');
    }
  });

  // 7. Demo Payment Confirmation Sandbox UI
  app.get('/api/payments/demo-pay', async (req: Request, res: Response) => {
    if (isProduction || PAYMENTS_MODE !== 'demo') {
      return res.status(503).send('Demo payment sandbox is disabled in production / live mode.');
    }

    const reference = req.query.reference as string;
    const payment = await getPaymentRecord(reference);

    if (!payment) {
      return res.status(404).send('Payment reference not found');
    }

    const typeLabel = payment.type === 'delivery_fee' 
      ? 'Transport Delivery Fee' 
      : payment.type === 'goods' 
        ? 'Inspected Goods Payment (At Safe Checkpoint)' 
        : 'Vendor Verification Fee';

    // Renders luxury dark theme payment confirmation matching Abbason Hub
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Paystack Demo Sandbox · Abbason Hub</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body { background: #020406; color: #E9E6DF; font-family: ui-sans-serif, system-ui, sans-serif; }
        </style>
      </head>
      <body class="flex items-center justify-center min-h-screen p-4">
        <div class="w-full max-w-md p-8 rounded-3xl bg-[#090D14] border border-[#C8A96A]/30 shadow-2xl space-y-6 text-center">
          <div class="w-14 h-14 mx-auto rounded-full bg-[#C8A96A]/10 border border-[#C8A96A]/40 flex items-center justify-center text-[#C8A96A]">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <span class="text-[10px] tracking-widest text-[#C8A96A] font-semibold uppercase">Paystack Simulator (Demo Mode)</span>
            <h2 class="text-xl font-serif text-white mt-1">Authorise Campus Payment</h2>
            <p class="text-xs text-[#8C9399] mt-1">${typeLabel}</p>
          </div>

          <div class="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5 space-y-3 text-left text-xs">
            <div class="flex justify-between">
              <span class="text-[#8C9399]">Reference:</span>
              <span class="font-mono text-white text-[11px]">${payment.reference}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-[#8C9399]">Processing Fee:</span>
              <span class="font-mono text-white">₦${payment.gatewayFee.toLocaleString()}</span>
            </div>
            <div class="border-t border-white/[0.08] pt-2 flex justify-between items-baseline">
              <span class="text-white font-medium">Total Charge:</span>
              <span class="text-lg font-mono font-bold text-[#C8A96A]">₦${payment.amountNaira.toLocaleString()}</span>
            </div>
          </div>

          <p class="text-[11px] text-[#8C9399]">
            This is an automated sandbox environment. No real funds are transferred. Tapping below completes settlement.
          </p>

          <a 
            href="/api/payments/verify?reference=${payment.reference}" 
            class="block w-full py-3.5 px-4 rounded-xl bg-[#C8A96A] hover:bg-[#D4AF37] text-[#020406] font-semibold text-xs tracking-wider uppercase transition-colors"
          >
            Confirm & Complete Payment
          </a>
        </div>
      </body>
      </html>
    `);
  });

  // 8. Manual / Cron Auto-settlement trigger (Requires Owner Admin authorization)
  app.post('/api/orders/auto-settle', requireOwnerAdmin, async (_req: Request, res: Response) => {
    await runAutoSettleAndReservations();
    res.json({ success: true, timestamp: new Date().toISOString() });
  });

  // --- PHASE 3: SELLER ONBOARDING & SUBACCOUNT ENGINE ---

  // 10. Vendor Fee Status
  app.get('/api/vendor-fee/status', async (_req: Request, res: Response) => {
    const paidCount = await getPaidVendorsCount();
    const currentFee = paidCount < EARLY_VENDOR_LIMIT ? VENDOR_FEE_EARLY : VENDOR_FEE_STANDARD;
    const gatewayFee = calculateGatewayFee(currentFee);
    res.json({
      paidCount,
      earlyLimit: EARLY_VENDOR_LIMIT,
      fee: currentFee,
      gatewayFee,
      totalWithGateway: currentFee + gatewayFee,
      isEarlyBird: paidCount < EARLY_VENDOR_LIMIT
    });
  });

  // 11. Admin Seller Approval & Paystack Subaccount Creation
  app.post('/api/admin/sellers/:userId/approve', requireOwnerAdmin, async (req: any, res: Response) => {
    try {
      if (PAYMENTS_MODE !== 'demo' && req.user?.email_verified !== true) {
        return res.status(403).json({ error: 'Owner email must be verified on Firebase Authentication.' });
      }

      const sellerId = req.params.userId;
      const user = await getUserProfile(sellerId);
      if (!user) {
        return res.status(404).json({ error: 'User profile not found' });
      }

      // Look up verification document
      let verifDoc = memoryVerifications.get(sellerId);
      if (!verifDoc && adminDb) {
        try {
          const snap = await adminDb.collection('verifications').doc(sellerId).get();
          if (snap.exists) {
            verifDoc = snap.data();
          } else {
            const qSnap = await adminDb.collection('verifications').where('userId', '==', sellerId).limit(1).get();
            if (!qSnap.empty) verifDoc = qSnap.docs[0].data();
          }
        } catch {}
      }

      const bankName = verifDoc?.bankName || user.bankDetails?.bankName;
      const accountNumber = verifDoc?.accountNumber || user.bankDetails?.accountNumber;
      const proposedAccountName = verifDoc?.accountName || user.bankDetails?.accountName || user.name;

      if (!accountNumber) {
        return res.status(400).json({ error: 'Seller account number is missing from verification dossier.' });
      }

      // Map bank to Paystack bank code
      const bankList = await getPaystackBanks();
      const providedBankCode = req.body?.bankCode || verifDoc?.bankCode || user.bankDetails?.bankCode;
      const bankCode = providedBankCode || (bankName ? findBankCode(bankName, bankList) : null);

      if (!bankCode) {
        return res.status(400).json({ 
          error: `Could not identify settlement bank code for "${bankName || 'unspecified bank'}". Please choose a bank from the supported bank list.` 
        });
      }

      // Resolve real account name
      let resolvedAccountName = proposedAccountName;
      if (PAYMENTS_MODE !== 'demo') {
        try {
          const resolveData = await paystackRequest(`/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`);
          resolvedAccountName = resolveData.account_name;
        } catch (resolveErr: any) {
          return res.status(400).json({ 
            error: `Failed to resolve bank account with Paystack: ${resolveErr.message}`,
            mismatch: false
          });
        }
      }

      // Compare names: require at least 2 distinct matching name parts
      const nameComparison = compareNames(user.name, resolvedAccountName);
      if (!nameComparison.matches) {
        return res.status(400).json({
          error: 'Bank account name mismatch',
          mismatch: true,
          sellerName: user.name,
          resolvedAccountName,
          matchedParts: nameComparison.matchedParts,
          message: `Bank account holder name "${resolvedAccountName}" does not match seller registered name "${user.name}". At least two name parts must match.`
        });
      }

      // Create Paystack subaccount
      let subaccountCode = `SUB_${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
      if (PAYMENTS_MODE !== 'demo') {
        try {
          const subaccountData = await paystackRequest('/subaccount', 'POST', {
            business_name: user.storeName || user.name,
            settlement_bank: bankCode,
            account_number: accountNumber,
            percentage_charge: 0,
            description: `Abbason Hub subaccount for ${user.name}`
          });
          subaccountCode = subaccountData.subaccount_code;
        } catch (subErr: any) {
          return res.status(500).json({ error: `Paystack subaccount creation failed: ${subErr.message}` });
        }
      }

      const maskedNumber = `******${accountNumber.slice(-4)}`;

      // Save subaccountCode in sellerPrivate/{uid}
      memorySellerPrivate.set(sellerId, {
        subaccountCode,
        bankCode,
        bankName,
        accountNumberMasked: maskedNumber,
        accountName: resolvedAccountName,
        subaccountVerified: false,
        updatedAt: new Date().toISOString()
      });

      if (adminDb) {
        try {
          await adminDb.collection('sellerPrivate').doc(sellerId).set({
            subaccountCode,
            bankCode,
            bankName,
            accountNumberMasked: maskedNumber,
            accountName: resolvedAccountName,
            subaccountVerified: false,
            updatedAt: new Date().toISOString()
          }, { merge: true });

          // Update user: approved_pending_fee, isVerifiedSeller: false, subaccountVerified: false
          await adminDb.collection('users').doc(sellerId).update({
            sellerVerificationStatus: 'approved_pending_fee',
            isVerifiedSeller: false,
            subaccountVerified: false,
            role: 'seller',
            bankDetails: {
              bankName,
              bankCode,
              accountNumberMasked: maskedNumber,
              accountName: resolvedAccountName
            }
          });

          // Write public seller profile
          await adminDb.collection('sellerProfiles').doc(sellerId).set({
            id: sellerId,
            storeName: user.storeName || user.name,
            campusId: user.campusId || 'all',
            campusName: user.campusName || 'Campus Hub',
            isVerifiedSeller: false,
            subaccountVerified: false,
            isSuspended: false
          }, { merge: true });

          // Update verification record: mask account number & delete raw account number
          if (verifDoc?.id) {
            await adminDb.collection('verifications').doc(verifDoc.id).update({
              status: 'approved',
              accountNumber: maskedNumber,
              bankCode,
              approvedAt: new Date().toISOString()
            });
          }
        } catch (dbErr: any) {
          console.warn('[Admin Approve] DB write warning:', dbErr.message);
        }
      }

      if (clientDb) {
        try {
          await updateDoc(doc(clientDb, 'users', sellerId), {
            sellerVerificationStatus: 'approved_pending_fee',
            isVerifiedSeller: false,
            subaccountVerified: false,
            role: 'seller'
          });
          await setDoc(doc(clientDb, 'sellerProfiles', sellerId), {
            id: sellerId,
            storeName: user.storeName || user.name,
            campusId: user.campusId || 'all',
            campusName: user.campusName || 'Campus Hub',
            isVerifiedSeller: false,
            subaccountVerified: false,
            isSuspended: false
          }, { merge: true });
        } catch {}
      }

      res.json({
        success: true,
        sellerId,
        subaccountCode,
        subaccountVerified: false,
        status: 'approved_pending_fee',
        message: 'Seller approved successfully. Prompted to pay vendor fee to unlock listing.'
      });
    } catch (err: any) {
      console.error('[Admin Approve Error]:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // 11b. Admin Verifies Seller Subaccount on Paystack
  app.post('/api/admin/sellers/:userId/verify-subaccount', requireOwnerAdmin, async (req: any, res: Response) => {
    try {
      const sellerId = req.params.userId;
      const priv = memorySellerPrivate.get(sellerId) || {};
      memorySellerPrivate.set(sellerId, {
        ...priv,
        subaccountVerified: true,
        verifiedAt: new Date().toISOString()
      });

      if (adminDb) {
        try {
          await adminDb.collection('sellerPrivate').doc(sellerId).set({
            subaccountVerified: true,
            verifiedAt: new Date().toISOString()
          }, { merge: true });
          await adminDb.collection('users').doc(sellerId).update({
            subaccountVerified: true
          });
          await adminDb.collection('sellerProfiles').doc(sellerId).set({
            subaccountVerified: true
          }, { merge: true });
        } catch (dbErr: any) {
          console.warn('[Verify Subaccount DB Error]:', dbErr.message);
        }
      }

      if (clientDb) {
        try {
          await updateDoc(doc(clientDb, 'users', sellerId), {
            subaccountVerified: true
          });
          await setDoc(doc(clientDb, 'sellerProfiles', sellerId), {
            subaccountVerified: true
          }, { merge: true });
        } catch {}
      }

      res.json({
        success: true,
        sellerId,
        subaccountVerified: true,
        message: 'Seller subaccount verified successfully on Paystack.'
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 12. Admin Seller Reject
  app.post('/api/admin/sellers/:userId/reject', requireOwnerAdmin, async (req: any, res: Response) => {
    try {
      const sellerId = req.params.userId;
      const { reason } = req.body;

      if (adminDb) {
        try {
          await adminDb.collection('users').doc(sellerId).update({
            sellerVerificationStatus: 'rejected',
            isVerifiedSeller: false,
            rejectionReason: reason || 'Information could not be verified'
          });
        } catch {}
      }

      if (clientDb) {
        try {
          await updateDoc(doc(clientDb, 'users', sellerId), {
            sellerVerificationStatus: 'rejected',
            isVerifiedSeller: false
          });
        } catch {}
      }

      res.json({ success: true, message: 'Seller verification rejected.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 13. Admin Seller Suspend
  app.post('/api/admin/sellers/:userId/suspend', requireOwnerAdmin, async (req: any, res: Response) => {
    try {
      const sellerId = req.params.userId;
      const durationDays = req.body.durationDays ? parseInt(req.body.durationDays, 10) : BAN_DAYS;
      const suspendedUntilMs = Date.now() + (durationDays * 24 * 3600 * 1000);

      if (adminDb) {
        try {
          await adminDb.collection('users').doc(sellerId).update({ suspendedUntilMs });
          await adminDb.collection('sellerProfiles').doc(sellerId).update({ isSuspended: true });
        } catch {}
      }

      if (clientDb) {
        try {
          await updateDoc(doc(clientDb, 'users', sellerId), { suspendedUntilMs });
          await updateDoc(doc(clientDb, 'sellerProfiles', sellerId), { isSuspended: true });
        } catch {}
      }

      res.json({ success: true, sellerId, suspendedUntilMs, message: `Seller suspended for ${durationDays} days.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 14. Admin Seller Unsuspend
  app.post('/api/admin/sellers/:userId/unsuspend', requireOwnerAdmin, async (req: any, res: Response) => {
    try {
      const sellerId = req.params.userId;

      if (adminDb) {
        try {
          await adminDb.collection('users').doc(sellerId).update({ suspendedUntilMs: 0 });
          await adminDb.collection('sellerProfiles').doc(sellerId).update({ isSuspended: false });
        } catch {}
      }

      if (clientDb) {
        try {
          await updateDoc(doc(clientDb, 'users', sellerId), { suspendedUntilMs: 0 });
          await updateDoc(doc(clientDb, 'sellerProfiles', sellerId), { isSuspended: false });
        } catch {}
      }

      res.json({ success: true, sellerId, message: 'Seller suspension lifted successfully.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 14b. Admin: Remove Seller Permanently (Owner Only)
  app.post('/api/admin/sellers/:userId/remove', requireOwnerAdmin, async (req: any, res: Response) => {
    try {
      const sellerId = req.params.userId;
      const { storeNameConfirm } = req.body;
      if (!sellerId) return res.status(400).json({ error: 'Seller ID is required' });

      let expectedStoreName = '';
      let subaccountCode = '';

      if (adminDb) {
        // Fetch seller profile to verify store name
        const profileSnap = await adminDb.collection('sellerProfiles').doc(sellerId).get();
        if (profileSnap.exists) {
          expectedStoreName = profileSnap.data().storeName || '';
        }
        const privateSnap = await adminDb.collection('sellerPrivate').doc(sellerId).get();
        if (privateSnap.exists) {
          subaccountCode = privateSnap.data().subaccountCode || '';
        }

        if (storeNameConfirm && expectedStoreName && storeNameConfirm.trim().toLowerCase() !== expectedStoreName.trim().toLowerCase()) {
          return res.status(400).json({ error: `Store name confirmation mismatch. Expected "${expectedStoreName}".` });
        }

        // 1. Mark user removedPermanently: true, sellerVerificationStatus: 'removed', block re-applying
        await adminDb.collection('users').doc(sellerId).update({
          removedPermanently: true,
          sellerVerificationStatus: 'removed',
          isVerifiedSeller: false,
          canApplySeller: false,
          updatedAt: new Date().toISOString()
        });

        // 2. Mark sellerProfile isSuspended: true, isRemoved: true, and hide
        await adminDb.collection('sellerProfiles').doc(sellerId).update({
          isSuspended: true,
          isRemoved: true,
          removedAt: new Date().toISOString()
        });

        // 3. Delete all of that seller's products
        const productsSnap = await adminDb.collection('products').where('sellerId', '==', sellerId).get();
        const batch = adminDb.batch();
        for (const pDoc of productsSnap.docs) {
          batch.delete(pDoc.ref);
        }
        await batch.commit();

        // 4. Cancel open orders and create refund records where delivery fee was paid
        const openOrdersSnap = await adminDb.collection('orders')
          .where('sellerId', '==', sellerId)
          .where('status', 'in', ['awaiting_payment', 'scheduled', 'in_transit', 'partially_paid'])
          .get();

        for (const ordDoc of openOrdersSnap.docs) {
          const ord = { id: ordDoc.id, ...ordDoc.data() };
          const orderUpdates: any = {
            status: 'cancelled',
            cancelReason: 'seller_removed',
            updatedAt: new Date().toISOString()
          };

          if (ord.deliveryFeePaid && (ord.deliveryFee || 0) > 0) {
            orderUpdates.refund = {
              owedAmount: ord.deliveryFee,
              multiplier: 1,
              status: 'owed',
              dueAt: Date.now() + 24 * 3600 * 1000
            };

            const refundCaseId = `ref_seller_rem_${ord.id}`;
            await adminDb.collection('complaints').doc(refundCaseId).set({
              id: refundCaseId,
              orderId: ord.id,
              orderNumber: ord.orderNumber,
              buyerId: ord.buyerId,
              buyerName: ord.buyerName,
              sellerId,
              sellerName: ord.sellerName,
              reason: 'Seller Removed - Delivery Fee Refund Owed',
              description: `Seller was permanently removed by platform administrator. ₦${ord.deliveryFee.toLocaleString()} refund owed to buyer by direct bank transfer.`,
              type: 'seller_removal_refund',
              status: 'open',
              refundAmount: ord.deliveryFee,
              createdAt: new Date().toISOString()
            });
          }

          await adminDb.collection('orders').doc(ord.id).update(orderUpdates);
          await restoreOrderStock(ord.id, ord.items);
        }

        // 5. Deactivate Paystack subaccount if possible
        let subaccountNote = '';
        if (subaccountCode && PAYMENTS_MODE !== 'demo') {
          try {
            await paystackRequest(`/subaccount/${subaccountCode}`, 'PUT', { active: false });
            await adminDb.collection('sellerPrivate').doc(sellerId).update({
              subaccountActive: false,
              removedPermanently: true
            });
            subaccountNote = ' Paystack subaccount deactivated.';
          } catch (pErr: any) {
            console.warn(`[Paystack Deactivate] Could not automatically deactivate subaccount ${subaccountCode}:`, pErr.message);
            subaccountNote = ` Note: Please deactivate subaccount "${subaccountCode}" by hand on the Paystack dashboard.`;
          }
        }

        return res.json({
          success: true,
          sellerId,
          message: `Seller "${expectedStoreName || sellerId}" permanently removed. Listings deleted, open orders cancelled and stock restored.${subaccountNote}`
        });
      } else {
        return res.status(503).json({ error: 'Server storage is not ready' });
      }
    } catch (err: any) {
      console.error('[Permanent Seller Removal Error]:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // 15. Seller Bank Change Request
  app.post('/api/sellers/bank-change-request', requireAuth, async (req: any, res: Response) => {
    try {
      const sellerId = req.user.uid;
      const { bankName, accountNumber, accountName } = req.body;

      if (!accountNumber || accountNumber.length < 10) {
        return res.status(400).json({ error: 'Valid 10-digit NUBAN account number required.' });
      }

      const changeReq = {
        userId: sellerId,
        userName: req.user.name || 'Vendor',
        bankName,
        accountNumber,
        accountName,
        status: 'pending',
        type: 'bank_change_request',
        submittedAt: new Date().toISOString()
      };

      memoryVerifications.set(sellerId, changeReq);

      if (adminDb) {
        try {
          await adminDb.collection('verifications').doc(`bank_${sellerId}`).set(changeReq, { merge: true });
        } catch {}
      }

      res.json({ success: true, message: 'Bank account change request submitted for admin review.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 15b. Seller Saves Nigerian Mobile Number
  app.post('/api/sellers/phone', requireAuth, async (req: any, res: Response) => {
    try {
      const sellerId = req.user.uid;
      const rawPhone = (req.body.phone || '').trim().replace(/\s+/g, '');
      const phoneRegex = /^(\+234|0)[789][01]\d{8}$/;

      if (!phoneRegex.test(rawPhone)) {
        return res.status(400).json({ error: 'Valid Nigerian mobile number (+234... or 070/080/081/090/091...) required.' });
      }

      const priv = memorySellerPrivate.get(sellerId) || {};
      memorySellerPrivate.set(sellerId, {
        ...priv,
        phone: rawPhone,
        phoneUpdatedAt: new Date().toISOString()
      });

      if (adminDb) {
        try {
          await adminDb.collection('sellerPrivate').doc(sellerId).set({
            phone: rawPhone,
            phoneUpdatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (dbErr: any) {
          console.error('[Seller Phone] DB error:', dbErr.message);
          return res.status(500).json({ error: 'Failed to save seller phone' });
        }
      }

      res.json({ success: true, phone: rawPhone, message: 'Seller phone number verified and saved privately.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 15c. Seller Phone Status
  app.get('/api/sellers/phone-status', requireAuth, async (req: any, res: Response) => {
    try {
      const sellerId = req.user.uid;
      let phone: string | null = null;
      if (adminDb) {
        const snap = await adminDb.collection('sellerPrivate').doc(sellerId).get();
        if (snap.exists) phone = snap.data()?.phone || null;
      }
      if (!phone && memorySellerPrivate.has(sellerId)) {
        phone = memorySellerPrivate.get(sellerId)?.phone || null;
      }

      res.json({
        hasPhone: !!phone,
        phoneMasked: phone ? `${phone.slice(0, 4)}****${phone.slice(-3)}` : null
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- PHASE 4: DELIVERY RULES, REFUNDS, STRIKES & ADMIN TOOLS ---

  // 16. Reject Order Item at Handover Inspection
  app.post('/api/orders/:id/items/:itemId/reject', requireAuth, async (req: any, res: Response) => {
    try {
      const { id: orderId, itemId } = req.params;
      const { reason } = req.body;

      if (!reason || !reason.trim()) {
        return res.status(400).json({ error: 'Reason is required for rejecting an item.' });
      }

      const order = await getOrderFromStorage(orderId);
      if (!order) return res.status(404).json({ error: 'Order not found' });

      const isBuyer = req.user.uid === order.buyerId;
      const isOwner = (req.user?.email || '').toLowerCase() === 'chukwuagoziemgracious@gmail.com';
      if (!isBuyer && !isOwner) {
        return res.status(403).json({ error: 'Unauthorized: Only buyer can reject item during inspection' });
      }

      const item = (order.items || []).find((i: any) => i.id === itemId || i.itemCode === itemId);
      if (!item) return res.status(404).json({ error: 'Item not found in order' });

      item.status = 'rejected';
      item.rejectionReason = reason.trim();
      item.rejectedAt = new Date().toISOString();

      // Recalculate remaining goods due
      const pendingItems = order.items.filter((i: any) => i.status === 'pending_inspection');
      order.goodsDue = pendingItems.reduce((sum: number, i: any) => sum + (i.price * (i.quantity || 1)), 0);

      // If all items are now either paid or rejected, order is completed
      if (pendingItems.length === 0) {
        order.status = 'paid_completed';
        order.completedAt = new Date().toISOString();
      }

      order.updatedAt = new Date().toISOString();
      await saveOrderToStorage(orderId, order);

      res.json({
        success: true,
        order,
        rejectedItem: item,
        message: 'Item rejected due to inspection fault. Delivery fee is non-refundable.'
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 18. Order Cancellation (Buyer cutoff 48h / Seller any time with refund obligation)
  app.post('/api/orders/:id/cancel', requireAuth, async (req: any, res: Response) => {
    try {
      const orderId = req.params.id;
      const order = await getOrderFromStorage(orderId);
      if (!order) return res.status(404).json({ error: 'Order not found' });

      const isBuyer = req.user.uid === order.buyerId;
      const isSeller = req.user.uid === order.sellerId;
      const isOwner = (req.user?.email || '').toLowerCase() === 'chukwuagoziemgracious@gmail.com';

      if (!isBuyer && !isSeller && !isOwner) {
        return res.status(403).json({ error: 'Unauthorized to cancel this order' });
      }

      if (order.status === 'paid_completed' || order.status === 'cancelled') {
        return res.status(400).json({ error: 'Order cannot be cancelled in its current state.' });
      }

      if (isBuyer && !isOwner) {
        // Enforce 48-hour cutoff before delivery deadline
        const cutoff = order.cancelCutoffMs || (order.deliveryDeadlineMs ? order.deliveryDeadlineMs - (CANCEL_CUTOFF_HOURS * 3600 * 1000) : 0);
        if (Date.now() >= cutoff) {
          return res.status(400).json({
            error: 'Cancellation closed. Orders can only be cancelled up to 48 hours before the delivery deadline.'
          });
        }
        order.status = 'cancelled';
        order.cancelReason = 'buyer_cancelled';
        await restoreOrderStock(order.id, order.items);
      } else if (isSeller && !isOwner) {
        // Seller cancels at any time: must refund buyer delivery fee (1x)
        order.status = 'cancelled';
        order.cancelReason = 'seller_cancelled';
        await restoreOrderStock(order.id, order.items);
        if (order.deliveryFeePaid && (order.deliveryFee || 0) > 0) {
          const deadline = order.deliveryDeadlineMs || Date.now();
          order.refund = {
            owedAmount: order.deliveryFee,
            multiplier: 1,
            status: 'owed',
            dueAt: deadline + (SELLER_GRACE_HOURS * 3600 * 1000)
          };
        }
      } else {
        // Owner admin cancel
        order.status = 'cancelled';
        order.cancelReason = req.body.reason || 'admin_cancelled';
        await restoreOrderStock(order.id, order.items);
      }

      order.updatedAt = new Date().toISOString();
      await saveOrderToStorage(orderId, order);

      res.json({
        success: true,
        order,
        message: 'Order cancelled successfully.'
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 18b. Agreed Time (Delivery order seller sets agreed time, max 60 chars)
  app.post('/api/orders/:id/agreed-time', requireAuth, async (req: any, res: Response) => {
    try {
      const orderId = req.params.id;
      const { agreedTime } = req.body;

      if (!agreedTime || typeof agreedTime !== 'string' || agreedTime.trim().length === 0) {
        return res.status(400).json({ error: 'Agreed time string is required.' });
      }
      if (agreedTime.trim().length > 60) {
        return res.status(400).json({ error: 'Agreed time cannot exceed 60 characters.' });
      }

      const order = await getOrderFromStorage(orderId);
      if (!order) return res.status(404).json({ error: 'Order not found' });

      const isSeller = req.user.uid === order.sellerId;
      const isOwner = (req.user?.email || '').toLowerCase() === 'chukwuagoziemgracious@gmail.com';
      if (!isSeller && !isOwner) {
        return res.status(403).json({ error: 'Unauthorized: Only seller can set agreed delivery time' });
      }

      order.agreedTime = agreedTime.trim();
      order.updatedAt = new Date().toISOString();
      await saveOrderToStorage(orderId, order);

      res.json({ success: true, order, agreedTime: order.agreedTime, message: 'Agreed delivery time updated.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 18c. Rule P4b: Buyer Reports Seller Did Not Answer / Did Not Show Up on Pickup/Free-Delivery
  app.post('/api/orders/:id/seller-unreachable', requireAuth, async (req: any, res: Response) => {
    try {
      const orderId = req.params.id;
      const order = await getOrderFromStorage(orderId);
      if (!order) return res.status(404).json({ error: 'Order not found' });

      const isBuyer = req.user.uid === order.buyerId;
      const isOwner = (req.user?.email || '').toLowerCase() === 'chukwuagoziemgracious@gmail.com';
      if (!isBuyer && !isOwner) {
        return res.status(403).json({ error: 'Unauthorized: Only buyer can report seller unreachable' });
      }

      const isPickupOrFree = (order.fulfillmentType === 'buyer_pickup' || (order.deliveryFee || 0) === 0);
      if (!isPickupOrFree) {
        return res.status(400).json({ error: 'This action applies to pickup and free-delivery orders only.' });
      }

      order.sellerUnreachableReported = true;
      order.sellerUnreachableReportedAt = new Date().toISOString();

      // If deadline reached or passed, cancel immediately and restore stock (no penalty, no admin case)
      const now = Date.now();
      if (!order.deliveryDeadlineMs || now >= order.deliveryDeadlineMs) {
        order.status = 'cancelled';
        order.cancelReason = 'seller_unreachable';
        await restoreOrderStock(order.id, order.items);
      }

      order.updatedAt = new Date().toISOString();
      await saveOrderToStorage(orderId, order);

      res.json({
        success: true,
        order,
        message: 'Report logged. No penalties applied. Order will be cancelled and stock restored when the deadline is reached.'
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 18d. Get Order Contact Information (Strict privacy rules)
  app.get('/api/orders/:id/contact', requireAuth, async (req: any, res: Response) => {
    try {
      const orderId = req.params.id;
      const order = await getOrderFromStorage(orderId);
      if (!order) return res.status(404).json({ error: 'Order not found' });

      const isBuyer = req.user.uid === order.buyerId;
      const isSeller = req.user.uid === order.sellerId;
      const isOwner = (req.user?.email || '').toLowerCase() === 'chukwuagoziemgracious@gmail.com';

      if (!isBuyer && !isSeller && !isOwner) {
        return res.status(403).json({ error: 'Unauthorized: You are not a party to this order.' });
      }

      let buyerContact: any = null;
      let sellerContact: any = null;

      if (adminDb) {
        try {
          const bSnap = await adminDb.collection('orders').doc(orderId).collection('contact').doc('buyer').get();
          if (bSnap.exists) buyerContact = bSnap.data();
          const sSnap = await adminDb.collection('orders').doc(orderId).collection('contact').doc('seller').get();
          if (sSnap.exists) sellerContact = sSnap.data();
        } catch {}
      } else {
        buyerContact = memoryBuyerContacts.get(orderId) || { name: order.buyerName, phone: '08012345678', location: order.deliveryInstructions };
        sellerContact = memorySellerContacts.get(orderId) || { name: order.sellerName, phone: '08087654321', pickupLocation: order.deliveryInstructions };
      }

      // Check contact sharing permission:
      const isCommitted = order.contactShared === true && order.status !== 'cancelled';

      const responsePayload: any = {
        contactShared: isCommitted,
        orderStatus: order.status
      };

      if (isOwner) {
        responsePayload.buyerContact = buyerContact;
        responsePayload.sellerContact = sellerContact;
      } else if (isBuyer) {
        responsePayload.buyerContact = buyerContact;
        if (isCommitted) responsePayload.sellerContact = sellerContact;
      } else if (isSeller) {
        responsePayload.sellerContact = sellerContact;
        if (isCommitted) responsePayload.buyerContact = buyerContact;
      }

      res.json(responsePayload);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 19. Refund Handshake: Buyer Registers Refund Bank Account
  app.post('/api/orders/:id/refund/bank-details', requireAuth, async (req: any, res: Response) => {
    try {
      const orderId = req.params.id;
      const { bankName, accountNumber, accountName } = req.body;

      if (!accountNumber || accountNumber.replace(/\D/g, '').length !== 10) {
        return res.status(400).json({ error: 'Valid 10-digit NUBAN account number required.' });
      }

      const order = await getOrderFromStorage(orderId);
      if (!order) return res.status(404).json({ error: 'Order not found' });

      const isBuyer = req.user.uid === order.buyerId;
      const isOwner = (req.user?.email || '').toLowerCase() === 'chukwuagoziemgracious@gmail.com';
      if (!isBuyer && !isOwner) {
        return res.status(403).json({ error: 'Unauthorized: Only buyer can specify refund bank details' });
      }

      order.refundAccount = {
        bankName: bankName || 'Nigerian Bank',
        accountNumber: accountNumber.replace(/\D/g, ''),
        accountName: (accountName || order.buyerName || '').trim(),
        submittedAt: new Date().toISOString()
      };

      order.updatedAt = new Date().toISOString();
      await saveOrderToStorage(orderId, order);

      res.json({ success: true, order, message: 'Refund payout account saved.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 20. Refund Handshake: Seller Taps "I Have Sent The Refund"
  app.post('/api/orders/:id/refund/mark-sent', requireAuth, async (req: any, res: Response) => {
    try {
      const orderId = req.params.id;
      const order = await getOrderFromStorage(orderId);
      if (!order) return res.status(404).json({ error: 'Order not found' });

      const isSeller = req.user.uid === order.sellerId;
      const isOwner = (req.user?.email || '').toLowerCase() === 'chukwuagoziemgracious@gmail.com';
      if (!isSeller && !isOwner) {
        return res.status(403).json({ error: 'Unauthorized: Only seller can claim refund sent' });
      }

      if (!order.refund) {
        order.refund = {
          owedAmount: order.deliveryFee || 0,
          multiplier: 1,
          status: 'owed',
          dueAt: Date.now() + (24 * 3600 * 1000)
        };
      }

      order.refund.status = 'paid_claimed';
      order.refund.claimedAt = new Date().toISOString();
      order.updatedAt = new Date().toISOString();
      await saveOrderToStorage(orderId, order);

      res.json({
        success: true,
        order,
        message: 'Refund marked as sent. Buyer prompted to confirm receipt.'
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 21. Refund Handshake: Buyer Confirms "I Received It"
  app.post('/api/orders/:id/refund/confirm', requireAuth, async (req: any, res: Response) => {
    try {
      const orderId = req.params.id;
      const order = await getOrderFromStorage(orderId);
      if (!order) return res.status(404).json({ error: 'Order not found' });

      const isBuyer = req.user.uid === order.buyerId;
      const isOwner = (req.user?.email || '').toLowerCase() === 'chukwuagoziemgracious@gmail.com';
      if (!isBuyer && !isOwner) {
        return res.status(403).json({ error: 'Unauthorized: Only buyer can confirm refund receipt' });
      }

      if (!order.refund) {
        return res.status(400).json({ error: 'No refund active on this order' });
      }

      order.refund.status = 'confirmed';
      order.refund.confirmedAt = new Date().toISOString();
      order.updatedAt = new Date().toISOString();
      await saveOrderToStorage(orderId, order);

      res.json({ success: true, order, message: 'Refund confirmed successfully.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 22. Refund Handshake: Buyer Disputes "I Did Not Receive It"
  app.post('/api/orders/:id/refund/dispute', requireAuth, async (req: any, res: Response) => {
    try {
      const orderId = req.params.id;
      const order = await getOrderFromStorage(orderId);
      if (!order) return res.status(404).json({ error: 'Order not found' });

      const isBuyer = req.user.uid === order.buyerId;
      const isOwner = (req.user?.email || '').toLowerCase() === 'chukwuagoziemgracious@gmail.com';
      if (!isBuyer && !isOwner) {
        return res.status(403).json({ error: 'Unauthorized: Only buyer can dispute refund' });
      }

      if (!order.refund) {
        return res.status(400).json({ error: 'No refund active on this order' });
      }

      order.refund.status = 'disputed';
      order.refund.disputedAt = new Date().toISOString();
      order.updatedAt = new Date().toISOString();

      const complaintId = `comp_ref_${Date.now()}`;
      const complaintRecord = {
        id: complaintId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        buyerId: order.buyerId,
        buyerName: order.buyerName,
        sellerId: order.sellerId,
        sellerName: order.sellerName,
        reason: 'Refund Not Received',
        description: req.body.description || 'Buyer did not receive delivery fee refund claimed by seller.',
        type: 'unconfirmed_refund',
        status: 'open',
        createdAt: new Date().toISOString()
      };

      memoryComplaints.set(complaintId, complaintRecord);
      if (adminDb) {
        try {
          await adminDb.collection('complaints').doc(complaintId).set(complaintRecord);
        } catch {}
      }

      await saveOrderToStorage(orderId, order);

      res.json({
        success: true,
        order,
        message: 'Refund disputed and forwarded to platform administration queue.'
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 23. Seller Reports Buyer Refusal or No-Show (Rule P3)
  app.post('/api/orders/:id/report-buyer-refusal', requireAuth, async (req: any, res: Response) => {
    try {
      const orderId = req.params.id;
      const { reason, refusalType } = req.body;

      if (!reason || !reason.trim()) {
        return res.status(400).json({ error: 'Specific reason explanation is required.' });
      }

      const order = await getOrderFromStorage(orderId);
      if (!order) return res.status(404).json({ error: 'Order not found' });

      const isSeller = req.user.uid === order.sellerId;
      const isOwner = (req.user?.email || '').toLowerCase() === 'chukwuagoziemgracious@gmail.com';
      if (!isSeller && !isOwner) {
        return res.status(403).json({ error: 'Unauthorized: Only seller can report buyer refusal or no-show' });
      }

      const reportTitle = refusalType === 'buyer_did_not_show_up' 
        ? 'Buyer Did Not Show Up' 
        : 'Buyer Refused Payment For Problem-Free Item';

      const complaintId = `comp_refuse_${Date.now()}`;
      const complaintRecord = {
        id: complaintId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        buyerId: order.buyerId,
        buyerName: order.buyerName,
        sellerId: order.sellerId,
        sellerName: order.sellerName,
        reason: reportTitle,
        description: reason.trim(),
        type: 'buyer_non_payment',
        refusalType: refusalType || 'refused_pay',
        status: 'open',
        createdAt: new Date().toISOString()
      };

      memoryComplaints.set(complaintId, complaintRecord);
      if (adminDb) {
        try {
          await adminDb.collection('complaints').doc(complaintId).set(complaintRecord);
        } catch {}
      }

      order.buyerReportedRefusal = true;
      order.sellerReport = {
        type: refusalType || 'refused_pay',
        reason: reason.trim(),
        reportedAt: new Date().toISOString()
      };
      order.updatedAt = new Date().toISOString();
      await saveOrderToStorage(orderId, order);

      res.json({
        success: true,
        order,
        message: 'Report submitted. Administrator will review for 30-day buyer suspension.'
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 24. Admin Bans Buyer or User For 30 Days
  app.post('/api/admin/users/:userId/ban', requireOwnerAdmin, async (req: any, res: Response) => {
    try {
      const userId = req.params.userId;
      const bannedUntilMs = Date.now() + (BAN_DAYS * 24 * 3600 * 1000);

      if (adminDb) {
        try {
          await adminDb.collection('users').doc(userId).update({
            bannedUntilMs,
            isBanned: false
          });
        } catch {}
      }
      if (clientDb) {
        try {
          await updateDoc(doc(clientDb, 'users', userId), { bannedUntilMs });
        } catch {}
      }

      res.json({
        success: true,
        userId,
        bannedUntilMs,
        message: `User suspended for ${BAN_DAYS} days.`
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 24b. Buyer Ban Status (Exempt from auth ban check)
  app.get('/api/me/ban-status', requireAuth, async (req: any, res: Response) => {
    try {
      const user = await getUserProfile(req.user.uid);
      const isBanned = !!(user?.bannedUntilMs && user.bannedUntilMs > Date.now());
      res.json({
        isBanned,
        bannedUntilMs: user?.bannedUntilMs || 0,
        banReason: user?.banReason || 'Safety infraction / Rule P4 buyer ghosting policy',
        buyerExplanation: user?.buyerExplanation || null,
        explanationSubmittedAt: user?.explanationSubmittedAt || null
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 24c. Buyer Submits Ban Explanation (Exempt from auth ban check)
  app.post('/api/me/ban-explanation', requireAuth, async (req: any, res: Response) => {
    try {
      const { explanation } = req.body;
      if (!explanation || !explanation.trim()) {
        return res.status(400).json({ error: 'Explanation is required.' });
      }
      if (explanation.trim().length > 1000) {
        return res.status(400).json({ error: 'Explanation cannot exceed 1000 characters.' });
      }

      const cleanExplanation = explanation.trim();
      const nowIso = new Date().toISOString();

      if (adminDb) {
        try {
          await adminDb.collection('users').doc(req.user.uid).update({
            buyerExplanation: cleanExplanation,
            explanationSubmittedAt: nowIso
          });
          await adminDb.collection('adminBanReviews').doc(req.user.uid).set({
            userId: req.user.uid,
            userName: req.user.name || 'Student',
            userEmail: req.user.email || '',
            explanation: cleanExplanation,
            submittedAt: nowIso,
            status: 'pending'
          }, { merge: true });
        } catch (dbErr: any) {
          console.warn('[Ban Explanation DB Warning]:', dbErr.message);
        }
      }

      res.json({
        success: true,
        message: 'Your explanation has been received and queued for administrator review.'
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 24d. Admin Ban Explanation Review Queue
  app.get('/api/admin/ban-reviews', requireOwnerAdmin, async (_req: any, res: Response) => {
    try {
      const reviews: any[] = [];
      if (adminDb) {
        try {
          const snap = await adminDb.collection('adminBanReviews').where('status', '==', 'pending').get();
          snap.forEach((doc: any) => reviews.push({ id: doc.id, ...doc.data() }));
        } catch {}
      }
      res.json({ success: true, reviews });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 24e. Admin Lifts Ban
  app.post('/api/admin/users/:userId/lift-ban', requireOwnerAdmin, async (req: any, res: Response) => {
    try {
      const userId = req.params.userId;
      if (adminDb) {
        try {
          await adminDb.collection('users').doc(userId).update({
            bannedUntilMs: 0,
            banLiftedAt: new Date().toISOString()
          });
          await adminDb.collection('adminBanReviews').doc(userId).set({
            status: 'lifted',
            reviewedAt: new Date().toISOString()
          }, { merge: true });
        } catch {}
      }
      res.json({ success: true, userId, message: 'Ban lifted successfully.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 24f. Admin Keeps Ban
  app.post('/api/admin/users/:userId/keep-ban', requireOwnerAdmin, async (req: any, res: Response) => {
    try {
      const userId = req.params.userId;
      if (adminDb) {
        try {
          await adminDb.collection('adminBanReviews').doc(userId).set({
            status: 'retained',
            reviewedAt: new Date().toISOString()
          }, { merge: true });
        } catch {}
      }
      res.json({ success: true, userId, message: 'Ban decision confirmed: ban retained.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 25. File Order Complaint (e.g. Late delivery)
  app.post('/api/orders/:id/complaint', requireAuth, async (req: any, res: Response) => {
    try {
      const orderId = req.params.id;
      const { reason, description } = req.body;

      const order = await getOrderFromStorage(orderId);
      if (!order) return res.status(404).json({ error: 'Order not found' });

      const complaintId = `comp_${Date.now()}`;
      const complaintRecord = {
        id: complaintId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        buyerId: order.buyerId,
        buyerName: order.buyerName,
        sellerId: order.sellerId,
        sellerName: order.sellerName,
        reason: reason || 'Late delivery',
        description: description || '',
        type: reason === 'Asked me to pay outside the app' ? 'off_app_payment' : (reason === 'Late delivery' ? 'late_delivery' : 'general'),
        status: 'open',
        createdAt: new Date().toISOString()
      };

      memoryComplaints.set(complaintId, complaintRecord);
      if (adminDb) {
        try {
          await adminDb.collection('complaints').doc(complaintId).set(complaintRecord);
        } catch {}
      }

      order.status = 'disputed';
      order.updatedAt = new Date().toISOString();
      await saveOrderToStorage(orderId, order);

      res.json({ success: true, complaint: complaintRecord, message: 'Complaint filed.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 26. Admin Dispute Resolve
  app.post('/api/admin/disputes/:id/resolve', requireOwnerAdmin, async (req: any, res: Response) => {
    try {
      const disputeId = req.params.id;
      const { resolutionNote, resolutionType } = req.body;

      let complaint = memoryComplaints.get(disputeId);
      if (!complaint && adminDb) {
        try {
          const snap = await adminDb.collection('complaints').doc(disputeId).get();
          if (snap.exists) complaint = snap.data();
        } catch {}
      }

      if (!complaint) return res.status(404).json({ error: 'Dispute record not found' });

      complaint.status = resolutionType === 'refund_buyer' ? 'resolved_refund' : 'resolved_payout';
      complaint.resolutionNote = resolutionNote || 'Resolved by administrator';
      complaint.resolvedAt = new Date().toISOString();

      memoryComplaints.set(disputeId, complaint);
      if (adminDb) {
        try {
          await adminDb.collection('complaints').doc(disputeId).set(complaint, { merge: true });
        } catch {}
      }

      res.json({ success: true, complaint, message: 'Dispute marked resolved.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 27. Admin Queues Endpoint (Overdue, Buyer Non-Payment, Unconfirmed Refunds, Open Complaints)
  app.get('/api/admin/queues', requireOwnerAdmin, async (_req: any, res: Response) => {
    try {
      const now = Date.now();
      const allOrdersList: any[] = [];

      if (adminDb) {
        try {
          const snap = await adminDb.collection('orders').limit(100).get();
          snap.forEach((d: any) => allOrdersList.push({ id: d.id, ...d.data() }));
        } catch {}
      }
      memoryOrders.forEach((o, id) => {
        if (!allOrdersList.find((x) => x.id === id)) allOrdersList.push({ id, ...o });
      });

      const allComplaintsList: any[] = [];
      if (adminDb) {
        try {
          const snap = await adminDb.collection('complaints').limit(100).get();
          snap.forEach((d: any) => allComplaintsList.push({ id: d.id, ...d.data() }));
        } catch {}
      }
      memoryComplaints.forEach((c, id) => {
        if (!allComplaintsList.find((x) => x.id === id)) allComplaintsList.push({ id, ...c });
      });

      // 1. Overdue orders & seller defaults
      const overdueOrders = allOrdersList.filter((o) => {
        const isPastDeadline = o.deliveryDeadlineMs && now > o.deliveryDeadlineMs && o.status !== 'paid_completed' && o.status !== 'cancelled';
        return isPastDeadline || o.sellerDefault === true;
      });

      // 2. Buyer Non-payment reports
      const buyerNonPaymentReports = allComplaintsList.filter((c) => c.type === 'buyer_non_payment' && c.status === 'open');

      // 3. Unconfirmed or Disputed Refunds
      const unconfirmedRefunds = allOrdersList.filter((o) => {
        return o.refund && (o.refund.status === 'disputed' || (o.refund.status === 'owed' && now > (o.refund.dueAt || 0)));
      });

      // 4. Open General Complaints
      const openComplaints = allComplaintsList.filter((c) => c.status === 'open' && c.type !== 'buyer_non_payment');

      // Calculate seller strikes
      const strikesBySeller: Record<string, number> = {};
      allOrdersList.forEach((o) => {
        if (o.sellerDefault && o.sellerId) {
          strikesBySeller[o.sellerId] = (strikesBySeller[o.sellerId] || 0) + 1;
        }
      });

      res.json({
        overdueOrders,
        buyerNonPaymentReports,
        unconfirmedRefunds,
        openComplaints,
        strikesBySeller
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 26. Admin: Collection Counter & Lifetime Limit Status
  app.get('/api/admin/collection-stats', requireOwnerAdmin, async (_req: any, res: Response) => {
    try {
      let totalCollectedNaira = 0;
      if (adminDb) {
        const paySnap = await adminDb.collection('payments').where('status', '==', 'success').get();
        for (const doc of paySnap.docs) {
          const d = doc.data();
          const amt = d.amountNaira || (d.amountKobo ? Math.round(d.amountKobo / 100) : 0);
          totalCollectedNaira += amt;
        }
      } else if (PAYMENTS_MODE === 'demo') {
        for (const p of memoryPayments.values()) {
          if (p.status === 'success') {
            totalCollectedNaira += (p.amountNaira || Math.round((p.amountKobo || 0) / 100));
          }
        }
      }

      const lifetimeLimitNaira = 8000000;
      const warnThresholdNaira = COLLECTION_WARN;
      const redThresholdNaira = COLLECTION_RED;
      let level: 'normal' | 'warn' | 'red' = 'normal';
      if (totalCollectedNaira >= redThresholdNaira) {
        level = 'red';
      } else if (totalCollectedNaira >= warnThresholdNaira) {
        level = 'warn';
      }

      res.json({
        success: true,
        totalCollectedNaira,
        lifetimeLimitNaira,
        warnThresholdNaira,
        redThresholdNaira,
        percentUsed: Math.min(100, (totalCollectedNaira / lifetimeLimitNaira) * 100),
        level
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite integration: middleware in development, static in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  // Periodic interval every 10 minutes
  setInterval(runAutoSettleAndReservations, 10 * 60 * 1000);

  app.listen(port, '0.0.0.0', () => {
    console.log(`Abbason Hub server running at http://0.0.0.0:${port} [${PAYMENTS_MODE.toUpperCase()} MODE]`);
    // Run background sweep once at server start as required by Phase C
    runAutoSettleAndReservations().catch((err: any) => {
      console.error('[Server Start] Initial runAutoSettleAndReservations notice:', err.message);
    });
  });
}

startServer().catch((err) => {
  console.error('Failed to start Abbason Hub server:', err);
  process.exit(1);
});
