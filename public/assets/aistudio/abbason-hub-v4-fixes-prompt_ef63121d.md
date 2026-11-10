# Abbason Hub: Version 4 fix prompt for Google AI Studio (Build mode)

This is a FIX update to the code that already exists. Do not change the design, colors, layout or any rule that is not mentioned here. Work in the 2 phases below. After each phase run lint and compile, fix errors, give me a short plain-language summary, then STOP and wait for me to type "continue".

If something cannot be done in this environment, do not fake it. Stop and tell me exactly what I need to add or do. Paystack is LIVE: treat every item as a real-money bug.

---

## PHASE A: Must-fix bugs before launch

**A1. Remove the hardcoded Paystack key.** In `server.ts`, `PAYSTACK_SECRET` currently falls back to a literal `sk_live_...` key. Change it to read ONLY `process.env.PAYSTACK_SECRET_KEY` (trimmed), with no fallback. If it is empty: in production the mode is `unconfigured` (payment endpoints return 503 "Payments are not configured"), outside production the mode is `demo`. Search the WHOLE project (server, src, shared, config files, comments, markdown, `.env*`, test files, build output) for `sk_live_`, `sk_test_`, `pk_live_`, `private_key` and any other secret, and remove every one. Never log the secret or any part of it. Make sure `.env`, `.env.*` (except `.env.example` with empty values) and any service account JSON are in `.gitignore`. In your summary tell me what you found and removed, without printing the secret itself.

**A2. Basket with 2 or more items fails at checkout.** In `/api/checkout`, the Firestore transaction does `transaction.get` on a product after already calling `transaction.update` on a previous one, which Firestore rejects. Rewrite it so ALL reads (every product) happen first and ALL writes (stock decrements, orders, contact documents) happen afterwards. Before the transaction, merge duplicate lines for the same `productId` by adding their quantities, then check stock against the merged total. Also: reject a buyer buying their own product; require a saved seller payout account (`sellerPrivate/{sellerId}.subaccountCode`) for every seller in the basket, with the error "This seller's payouts are not set up yet"; require `scheduledDate` for both delivery and pickup; and compute `deliveryDeadlineMs` as the end of the chosen day in Africa/Lagos time (for a `YYYY-MM-DD` date use `Date.parse(date + 'T23:59:59+01:00')`).

**A3. Suspended buyers never get back in.** The automatic ban sets `isBanned: true`, which has no end date and blocks the buyer forever, and "Lift ban" does not clear it. Make `bannedUntilMs` the ONLY ban field: an account is banned if and only if `bannedUntilMs > Date.now()`. Remove every write of `isBanned: true` (the automatic job, the manual ban, anywhere else) and remove the separate `isBanned` blocks in `requireAuth`, `/api/checkout` and the ban-status endpoint and banner. "Lift ban" sets `bannedUntilMs: 0` and deletes the `isBanned` field. Add a one-time cleanup that deletes the `isBanned` field from every user document that has it and sets `bannedUntilMs` to now + 30 days only if it was `isBanned: true` with no future `bannedUntilMs` and was set by rule P4 (otherwise just delete the field). Also remove the `clientDb` fallbacks in the ban and lift routes.

**A4. Seller profiles do not load for normal users.** The `sellerProfiles` rule `allow list` depends on `resource.data.isRemoved`, but the app lists the whole collection with no filter, so Firestore refuses it. Change it to `allow list: if true;` (the collection holds only safe public fields) and make the client skip profiles where `isRemoved === true`. Also make the client skip those sellers' products if any remain. Give me the full updated `firestore.rules`.

**A5. Webhook and return page.** In `/api/paystack/webhook`: if `handlePaymentSuccess` fails because of a temporary reason (Paystack verify request failed, the payment is currently being processed, a database error) respond with HTTP 500 so Paystack retries. If it fails for a permanent reason (reference not found, amount or currency mismatch) respond 200 and write an admin complaint "Payment verification failed" with the reference and details. Return a structured result from `handlePaymentSuccess` such as `{ success, retry, message, order? }`. In `/api/payments/verify`, check the result: success redirects to `/?payment_status=success&...`; a temporary problem redirects to `/?payment_status=pending&reference=...`; anything else redirects to `/?payment_error=...`. In `App.tsx` show "Payment confirmed" only for `success`, "Your payment is being confirmed, check your orders in a minute" for `pending`, and the error text otherwise.

**A6. Late, duplicate and unusable payments.** Inside the `handlePaymentSuccess` transaction add these checks, all before changing any order:
- `delivery_fee`: if the order's status is not `awaiting_payment` (for example it was cancelled after the 30-minute reservation), do NOT bring the order back and do not change stock.
- `goods`: if the order is `cancelled`, or its status is not `scheduled`, `in_transit` or `partially_paid`, or ANY item on the payment record is no longer `pending_inspection` (already paid or rejected), do not change the order and do not add any commission.
- In those cases mark the payment `status: 'success'` with `needsRefund: true` and a `refundReason`, and create an admin complaint (type `payment_needs_refund`) with the reference, the amount and the buyer, with the text "Customer paid but the order could not accept it. Refund this payment from the Paystack dashboard." Show these in the existing admin queue.
- Reuse pending payments: in `/api/payments/initialize`, if a `pending` payment already exists for the same buyer, order, type and item set that is less than 30 minutes old, return its stored `authorization_url` instead of creating a new one (store `authorization_url` on the payment record when it is created).

After Phase A: lint, compile, summary, then WAIT.

---

## PHASE B: Smaller fixes

**B1. Cancelling after payment.** The buyer cancel route, the seller cancel route and `/api/orders/:id/seller-unreachable` must refuse to cancel an order that has any paid item or `goodsPaid > 0`, with a clear message. `restoreOrderStock` must restore stock only for items whose status is not `paid`. Orders with a status of `partially_paid` can never be cancelled by buyer or seller.

**B2. Penalty job matches the rules.** In `runAutoSettleAndReservations` rule P4 must skip an order only when there is a seller report (`sellerReport` or `buyerReportedRefusal`) or the buyer used "seller did not answer" (`sellerUnreachableReported`). Remove the `complaintFiled` / `hasComplaint` check. P4b: an order with `sellerUnreachableReported` is cancelled with no penalty at its deadline, and must also never be touched by P4.

**B3. Silent failures.** Replace every empty `catch {}` and every swallowed error on report, complaint, ban, lift-ban, keep-ban, remove-seller, verify-subaccount and refund writes with logging plus an error response (HTTP 500) so the seller or admin sees that it failed. A report must never say "submitted" if it was not saved.

**B4. Leftover wording and code.** Rename `pendingEscrowAmount` in the admin dashboard (label "Awaiting payment at handover"), remove `escrow_held` from `types.ts` and everywhere it is shown, delete the `deliveryOtpForBuyer` stripping code in `firebase.ts`, and in `OrderReceiptModal.tsx` remove the `order.sellerPhone` fallback (use only the contact document). User-facing text only; do not change layout.

After Phase B: lint, compile, and a final summary.

---

## What I must do by hand (list these at the very end)
1. Regenerate the Paystack live secret key in the Paystack dashboard, then put the NEW key only in AI Studio's Secrets as `PAYSTACK_SECRET_KEY`.
2. Set `APP_BASE_URL` in Secrets and check the webhook URL in the Paystack dashboard.
3. Publish the updated `firestore.rules` in the Firebase console.
4. Make the GitHub repo private.
