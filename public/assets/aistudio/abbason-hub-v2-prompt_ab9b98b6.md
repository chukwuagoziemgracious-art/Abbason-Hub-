# Abbason Hub: Version 2 prompt for Google AI Studio (Build mode)

This prompt REPLACES all earlier prompts. First check the current code and skip anything that is already done. Work in the 4 phases below. After each phase, run lint and compile, fix errors, give me a short summary, and then STOP and wait for me to type "continue". Do not change the visual design, colors, fonts or layout. New screens and buttons must reuse the app's existing styling.

If you cannot do something in this environment (for example server credentials), do not fake it. Stop and tell me exactly what I need to add or do.

---

## The business rules (read these first)

**Who pays what**
- **Delivery fee** (only when the seller delivers): paid by the buyer online through Paystack at checkout. It goes to the seller through a Paystack split. The platform takes 0%. The buyer pays Paystack's processing fee on top.
- **Goods:** paid by the buyer through Paystack at handover, after inspecting the item, per item or all at once. The seller receives the price minus 3% commission. The platform keeps the 3%. The buyer pays Paystack's processing fee on top.
- **Vendor fee:** each new vendor pays a one-time fee to the platform after I approve them: 2,000 naira for the first 20 vendors, then 5,000 naira. The vendor pays Paystack's processing fee on top. There is no deposit and the platform never holds anyone's money.

**Buyer rules**
- A buyer may cancel until 48 hours before the delivery deadline. The delivery fee is NOT refunded when the buyer cancels.
- After that cutoff the buyer cannot cancel.
- The seller sees the buyer's phone number only in the last 48 hours before the delivery deadline. It becomes visible at the same moment cancelling closes.
- If the buyer does not pay for an item that has no problem, the seller reports it. After admin review the buyer is banned for 30 days.
- If the seller shows up but the item has a problem, the buyer pays nothing for the goods, and the delivery fee is not refunded.

**Seller rules**
- A seller may cancel at any time. They must refund the buyer's delivery fee (1x) by bank transfer outside the app. If the seller refunds within 24 hours after the stated delivery deadline, there is no penalty.
- If 24 hours after the deadline pass and the order is still not delivered and the refund is not confirmed, the seller now owes the buyer 2x the delivery fee in total (this includes giving back the fee), by bank transfer. This counts as a strike. If it is not paid, I close the seller's account for 30 days.

**Delivery schedule**
- On each listing the seller chooses: within 3 days, within 7 days, or specific weekdays (can pick several, e.g. Friday and Saturday), plus an optional time slot (morning, afternoon, evening, any). Never longer than 7 days.
- The buyer chooses a meeting point: a safe checkpoint from the campus list (`safeMeetupPoints`), or their own location typed in (3 to 120 characters). Pickup means the buyer goes to a safe checkpoint to collect from the seller.
- For specific weekdays the buyer picks one of the next matching dates, starting tomorrow, up to 7 days ahead. Use the Africa/Lagos time zone.
- An order is "Overdue" once its deadline passes and it is not delivered.

**Constants** (put them in one shared config file, for example `shared/config.ts`, used by both client and server):
`VENDOR_FEE_EARLY = 2000`, `EARLY_VENDOR_LIMIT = 20`, `VENDOR_FEE_STANDARD = 5000`, `COMMISSION_RATE = 0.03`, `COMMISSION_CAP = null` (no cap), `CANCEL_CUTOFF_HOURS = 48`, `SELLER_GRACE_HOURS = 24`, `BAN_DAYS = 30`, `MAX_DELIVERY_DAYS = 7`, `PENALTY_MULTIPLIER = 2`.

**Money formulas** (all amounts computed on the SERVER only, never trusted from the browser; Paystack amounts are in kobo = naira x 100)
- `fee(x)` = the existing `calculateGatewayFee(x)` (1.5% + 100 naira above 2,500, capped at 2,000).
- Delivery fee payment: charge `deliveryFee + fee(deliveryFee)`. Split to the seller's subaccount with `transaction_charge = fee(deliveryFee)` going to the main account and `bearer: 'account'`, so the seller receives exactly `deliveryFee`.
- Goods payment: `commission = round(COMMISSION_RATE * goodsAmount)`. Charge `goodsAmount + fee(goodsAmount)`. `transaction_charge = commission + fee(goodsAmount)`, `bearer: 'account'`. The seller receives `goodsAmount - commission`.
- Vendor fee: charge `vendorFee + fee(vendorFee)`. No subaccount.

---

## PHASE 1: Cleanup and foundations (no payments yet)

1. **Google sign-in only.** In `AuthModal.tsx` remove the email and password form. The only way in is "Continue with Google". Delete `authenticateWithPassword`, the `abbason_student_passwords_v1` localStorage key (remove it on startup if present), and the `password` parameter of `registerUser`. Remove the "switch to preloaded student/persona" buttons (or keep them only when `import.meta.env.DEV` is true). User ids are the Firebase `uid`: create the profile with `id = fbUser.uid` from the start, save it with `saveUserToFirestore`, load it from Firestore by uid on later sign-ins, restore the session with `onAuthChange`, and make logout call `logoutUser()`. Keep the owner admin check: admin console only for a real Google session with email `chukwuagoziemgracious@gmail.com`.
2. **Remove the delivery code (OTP).** Delete OTP generation, hashing, `buyerOtpVault`, `getBuyerOtp`, `saveBuyerOtp`, `verifyDeliveryOtp`, the `abbason_buyer_vault_v1` key (remove on startup), the OTP UI in `MyOrdersModal.tsx`, `OrderReceiptModal.tsx`, `SellerDashboard.tsx`, the `/api/orders/verify-delivery-otp` route, `src/utils/crypto.ts` if unused, and all otp fields on `Order`.
3. **Remove sellers' phone numbers from public listings and remove "contact seller".** Remove `sellerPhone` from the `Product` type, `createProduct`, seed data and every UI use. Remove any "Contact seller / Chat with seller / WhatsApp seller" button, with no replacement. Leave the platform's own floating WhatsApp help button and modal as they are. Add `!('sellerPhone' in data)` to `isValidProduct` in `firestore.rules`. On owner admin sign-in, run a one-time cleanup that removes `sellerPhone` from existing product documents with `deleteField()`.
4. **Private profiles.** In `firestore.rules`, `users/{userId}` `get` is allowed only for the owner or admin; `list` and `delete` admin only. Add a public collection `sellerProfiles/{sellerId}` with only: `id`, `storeName`, `campusId`, `campusName`, `isVerifiedSeller`, `isSuspended`. Rules: `get, list` public; reject any document containing `phone`, `email`, `hostel`, `bankDetails`, `rating`, `reviewsCount`, `salesCount`; only admin (or the server) may set `isVerifiedSeller` or `isSuspended`. The owner may only update `storeName`, `campusId`, `campusName`. The app shows public seller info only from `sellerProfiles`. Ratings are computed from the public `reviews` collection (existing `getSellerRatingSummary`). Do not show `salesCount` publicly.
5. **Lock self-verification.** In `users` rules: on create by the owner, `role` must be `'student'` or `'seller'`, `isVerifiedSeller` absent or false, `sellerVerificationStatus` absent or `'not_applied'`. On update by the owner, the changed keys must NOT include `isVerifiedSeller`, `role`, `rating`, `reviewsCount`, `salesCount`, `bannedUntilMs`, `suspendedUntilMs`, `subaccountCode`; and `sellerVerificationStatus` may only change to `'pending'`. In `products` create, require the signed-in user to be a verified seller or admin: `get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isVerifiedSeller == true`.
6. **Listing schedule and delivery fields.** Add `deliverySchedule` to `Product`: `{ type: 'within_3_days' | 'within_7_days' | 'specific_days', days?: number[] (0 = Sunday), timeSlot: 'morning' | 'afternoon' | 'evening' | 'any' }`. Add the picker to `NewListingModal.tsx`, show it in words on `ProductDetailModal.tsx`, default old products to `within_7_days`. In `isValidProduct`, when present require `deliverySchedule.type in [...]`.
7. **Order sync.** `store.ts` must subscribe to orders after the user is known and resubscribe when the user changes (keep and call the unsubscribe). Owner admin: limited whole-collection query. Everyone else: two queries, `where('buyerId','==',uid)` and `where('sellerId','==',uid)`, merged by order id; the remote copy wins. Nothing when signed out.
8. **Remove the old simulated Paystack and escrow wording.** Delete every claim like "received via Paystack", "Verified via Paystack", escrow, deposit and payout-released text, and the fake payment functions `payOrderItem` / `payVendorOrder` / simulated checkout. They will be rebuilt in Phase 2 and 4. Until then the checkout button should say "Payments coming soon" and be disabled. Keep the UI layout.

After Phase 1: lint, compile, summary, then WAIT.

---

## PHASE 2: Server, Paystack and order security

**Environment.** Server secrets come from environment variables (use the AI Studio Secrets panel): `PAYSTACK_SECRET_KEY`, `APP_BASE_URL`. Never put the secret key in client code or logs. Use `firebase-admin` on the server with default credentials (the same Firebase project and the same `firestoreDatabaseId` from `firebase-applet-config.json`). If admin credentials are not available in this environment, STOP and tell me exactly what to add.

**Payments mode.** `GET /api/config` returns `{ paymentsMode: 'demo' | 'test' | 'live' }`: `demo` when there is no `PAYSTACK_SECRET_KEY`, `test` when it starts with `sk_test_`, `live` when it starts with `sk_live_`. The client shows a small banner "Demo mode: no real money" or "Test mode" accordingly, and nothing in live mode. In demo mode the server skips Paystack and shows a clearly labelled demo checkout page that "succeeds" and runs the same success handler as the webhook, so the whole app can be tested with no keys.

**All order writes go through the server.** In `firestore.rules`: orders `get` and `list` only for the buyer, the seller or admin (list queries must be constrained as in Phase 1); `create`, `update`: `if false`; `delete`: admin. Complaints: `get` and `list` for the parties and admin, `create`, `update`: `if false`. Add `payments/{ref}` with no client access, and `sellerPrivate/{uid}` readable only by the owner and admin, never writable by clients. The server uses the admin SDK, which bypasses rules. Client code must never write orders or payment fields.

**Server endpoints** (Express, all except config and webhook require a Firebase ID token in the `Authorization: Bearer` header and are verified with admin `verifyIdToken`; reject banned users, i.e. `bannedUntilMs` in the future):
- `POST /api/checkout`: body has the basket plus, per seller, the meeting point, fulfillment type and chosen date. The server re-reads products from Firestore, rechecks prices, stock (inside a Firestore transaction that decrements stock and fails with a clear message if not enough), seller is verified and not suspended, and that the delivery deadline is within 7 days. It creates one order per seller. Orders with a delivery fee start as `awaiting_payment` and a stock reservation that expires after 30 minutes (a simple server interval releases it); pickup orders start as `scheduled`. Order fields: everything from the previous design plus `meetingPoint { kind: 'safe_checkpoint' | 'custom', label }`, `scheduledDate?`, `deliveryDeadlineMs`, `contactRevealAtMs = deliveryDeadlineMs - 48h`, `timeSlot`, `items` (each with `status: 'pending_inspection' | 'paid' | 'rejected'`), `deliveryFee`, `deliveryFeePaid`, `goodsDue`, `goodsPaid`, `commissionCollected`. Do NOT store the buyer's phone on the order document.
- The buyer's phone and name go to `orders/{orderId}/contact/buyer`, written by the server. Rule: the buyer and admin can read it any time; the seller can read it only when `request.time.toMillis() >= get(/databases/$(database)/documents/orders/$(orderId)).data.contactRevealAtMs`. No client writes.
- `POST /api/payments/initialize`: body `{ type: 'delivery_fee' | 'goods' | 'vendor_fee', orderId?, itemIds? }`. The server computes amounts with the formulas above, creates a reference, saves `payments/{reference}` with expected amount, type, order and items, then calls Paystack transaction initialize (with `subaccount`, `transaction_charge`, `bearer: 'account'` as above, and metadata) and returns the `authorization_url`. The client redirects to it. If Paystack answers with a collection-limit or account error, show "Payments are temporarily unavailable" and record it for admin.
- `GET /api/payments/verify?reference=`: callback page target. It verifies with Paystack's verify endpoint and runs the same success handler, then redirects back into the app.
- `POST /api/paystack/webhook`: use the raw body, verify the `x-paystack-signature` HMAC SHA512 with the secret key, and handle `charge.success` idempotently: look up `payments/{reference}`, confirm amount, currency and status with Paystack's verify API, ignore if already processed, then apply the result with the admin SDK: delivery fee paid, so the order becomes `scheduled`; goods paid, so the chosen items become `paid`, update `goodsPaid` and `commissionCollected`, and when all items are paid the order becomes `paid_completed`; vendor fee paid, so the seller becomes `verified` (see Phase 3). Never trust the browser for payment success.
- Every endpoint returns clear error messages the UI can show.

**Client changes.** `CheckoutModal.tsx` collects meeting point and date per seller, shows per-seller totals and the combined total (computed with the same shared helper the server uses), then calls `/api/checkout` and, for each seller with a delivery fee, `/api/payments/initialize` one seller at a time ("Pay seller 1 of 2"). The receipt lists every order. The checkout total must equal the sum of what the server charges.

After Phase 2: lint, compile, summary, list the environment variables and the webhook URL I must set in Paystack (`/api/paystack/webhook`), then WAIT.

---

## PHASE 3: Seller onboarding with Paystack subaccounts

- **Approval goes through the server.** `POST /api/admin/sellers/:userId/approve` (the caller's token email must be the owner's, with `email_verified` true) reads the seller's verification request (bank name, account number, account name). It maps the bank to a Paystack bank code (fetch Paystack's list of Nigerian banks once and cache it). It calls Paystack account resolution to get the real account name and compares it with the seller's name (case-insensitive, ignoring order and punctuation; require at least two name parts to match). If it does not match, do not approve: return the mismatch to the admin screen. If it matches, create the subaccount (`business_name` = store name, bank code, account number, `percentage_charge: 0`), and save the returned `subaccountCode` in `sellerPrivate/{uid}`. Then set the seller to `approved_pending_fee` and write `sellerProfiles/{uid}` with `isVerifiedSeller: false`. Afterwards keep only the masked account number (last 4 digits) and delete the full number from the verification request. Add reject, suspend and unsuspend endpoints too.
- **Vendor fee.** An `approved_pending_fee` seller sees "Pay your vendor fee to start selling". The server picks the amount from a counter document that counts paid vendors, using a transaction: 2,000 naira while fewer than 20 vendors have paid, otherwise 5,000. When the webhook confirms payment, set `isVerifiedSeller: true`, `sellerVerificationStatus: 'verified'`, update `sellerProfiles`, and increase the counter.
- **Bank changes** go through the admin as a new request, and the server updates the subaccount only after approval. Never let a seller change their payout account by themselves.
- Move all `approveSellerVerification`-style client logic to call these endpoints. The admin dashboard shows the account-name mismatch clearly.
- `SellerDashboard.tsx` "My Earnings": show goods price, 3% commission and net for each paid item, and delivery fees received. Do not claim anything the server has not confirmed.

After Phase 3: lint, compile, summary, then WAIT.

---

## PHASE 4: Delivery rules, refunds, strikes and admin tools

All of these are server endpoints (same auth), and every action updates the order only through the server.

- **Seller marks delivered:** `POST /api/orders/:id/mark-delivered` sets `delivered_pending_inspection`.
- **Goods payment at handover:** the buyer can pay per item or all remaining items (`POST /api/payments/initialize` with type `goods`). Items the buyer rejects as faulty are marked `rejected` through `POST /api/orders/:id/items/:itemId/reject` (reason required); no goods payment, and the delivery fee is not refunded. If every item is paid or rejected the order is completed.
- **Buyer cancel:** `POST /api/orders/:id/cancel` for the buyer only until `contactRevealAtMs`; the server enforces it. Status `cancelled`, `cancelReason: 'buyer_cancelled'`, restore stock. The UI shows "You can cancel until <date and time>" or "Cancellation closed".
- **Seller cancel (any time):** status `cancelled`, `cancelReason: 'seller_cancelled'`, restore stock. If a delivery fee was paid, set `refund { owedAmount: deliveryFee, multiplier: 1, status: 'owed', dueAt: deliveryDeadlineMs + 24h }`.
- **Seller default:** a server interval (every 10 minutes) finds orders that are not delivered or cancelled, or have an unconfirmed refund, past `deliveryDeadlineMs + 24h`. For each it sets `sellerDefault: true`, `refund.multiplier: 2`, `refund.owedAmount: 2 x deliveryFee`, `refund.status: 'owed'`. For pickup orders with no delivery fee there is no refund, but the order is still flagged overdue and counts as a strike.
- **Refund handshake (bank transfer outside the app):** the buyer enters a refund bank account when a refund is owed (stored on the order; only the buyer, seller and admin can read orders). The seller taps "I have sent the refund" (`refund.status: 'paid_claimed'`), then the buyer taps "I received it" (`confirmed`) or "I did not receive it" (admin queue).
- **Buyer refused to pay:** the seller taps "Buyer refused to pay for a problem-free item" (reason required, within the delivery window) which creates an admin review item. The buyer can reply with their side. The admin decides and can tap "Ban buyer for 30 days", which sets `bannedUntilMs` through the server. Banned buyers are blocked from checkout and a clear message says until when.
- **Overdue:** show an "Overdue" badge on buyer, seller and admin screens once `deliveryDeadlineMs` has passed. Show the buyer "Report late delivery", which opens the existing complaint form with the reason "Late delivery". Complaints are created and resolved only through server endpoints (`POST /api/orders/:id/complaint`, admin `POST /api/admin/disputes/:id/resolve`).
- **Strikes:** one strike = one order with `sellerDefault: true`. The seller sees their own count. The admin dashboard has a Strikes column per seller (counted from all orders) and buttons "Close account for 30 days" and "Reopen", which set `suspendedUntilMs` and `sellerProfiles.isSuspended`. Suspended sellers' products are hidden from the public catalog and the server rejects checkout for them. Buyers never see strikes.
- **Admin queues** on the existing admin dashboard (no new design): Overdue and defaulted sellers, buyer non-payment reports, refunds the buyer says they did not receive, open complaints.

After Phase 4: lint, compile, and give me a final summary.

---

## What I must do manually (list these at the very end)
1. Add the secrets `PAYSTACK_SECRET_KEY` and `APP_BASE_URL` (start with a `sk_test_` key).
2. In Paystack, set the webhook URL to `<APP_BASE_URL>/api/paystack/webhook`.
3. Publish the updated `firestore.rules` in the Firebase console.
4. Anything else you could not do here.
