# Abbason Hub — Seller Earnings, Nigerian Bank Payouts & WhatsApp Updates Plan

A focused plan to introduce a dedicated **My Earnings** section in the Seller Dashboard with clear 3% commission calculations, an accessible Nigerian bank switcher (featuring OPay, PalmPay, and commercial banks), streamlined WhatsApp contact integration using phone number **08022201727**, and custom brand logo support for the top header.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following key decisions have been aligned with your preferences:

- **Dedicated 'My Earnings' Tab**: The Seller Dashboard will feature a dedicated tab displaying live earnings calculations (Gross Sales, 3% Verified Seller Platform Commission capped at ₦2,000, and Net Take-Home), pending escrow amount, and realized payouts. It strictly calculates amounts without locking or holding seller funds directly.
- **Comprehensive Nigerian Bank & Fintech Switcher**: Full support for all Nigerian banking institutions, prioritizing **OPay**, **PalmPay**, **Moniepoint**, **Kuda**, alongside major commercial banks (**Access Bank**, **Zenith Bank**, **GTBank**, **First Bank**, **UBA**, **FCMB**, etc.) with quick search and one-tap bank account updates.
- **Streamlined Homepage Footer & WhatsApp Contact**: Removal of the bulky promotional banner at the foot of the homepage, leaving a clean text note and the floating WhatsApp button linked directly to **08022201727** (`https://wa.me/2348022201727`).
- **Brand Image in Header**: Replacing the placeholder top graphic with custom brand image integration next to "Abbason Hub", supporting instant image file selection and persistence.

---

### 1. Overview & Core Concept

- **What It Delivers**:
  1. **Transparent Seller Accounting**: Sellers can clearly audit their sales revenue, pending transactions awaiting delivery code entry, and platform fee deductions without confusion.
  2. **Fast Bank Account Management**: Campus merchants can easily route their automated payouts to their preferred digital wallet or bank (especially mobile-friendly fintechs like PalmPay and OPay popular among students).
  3. **Uncluttered Marketplace Presentation**: Minimalist, high-conversion homepage without redundant large blocks, maintaining direct WhatsApp access.

---

### 2. User Experience & Visual Design

#### A. Key User Flows
```
[ Seller Dashboard ]
       │
       ├──► Tab: "My Earnings"
       │     ├── 1. Calculation Cards:
       │     │      • Net Earnings Paid Out (Total credited to seller bank)
       │     │      • Pending In Escrow (Awaiting buyer OTP delivery handshake)
       │     │      • Platform Commission Deducted (3% capped at ₦2,000/order)
       │     ├── 2. Settlement Bank & Fintech Card:
       │     │      • Active Bank: [ PalmPay / OPay / Access / GTBank ... ]
       │     │      • Account Number & Account Name
       │     │      • [Change Settlement Bank] Modal with searchable list
       │     └── 3. Itemized Payout Breakdown:
       │            • Per-order calculation log (Gross ₦ - 3% Fee = Net Payout)
       │
[ Homepage Footer ]
       ├── Clean 1-line text note: "Direct WhatsApp Desk: 08022201727 · Payluk Escrow"
       └── Floating high-visibility WhatsApp button with one-tap chat trigger
```

#### B. Visual Identity & Styling
- **Color Tokens**:
  - Background: Deep navy slate (`#0B1120`, `#0F172A`)
  - Accent: High-contrast gold (`#f3c84b`) and clean emerald (`#10b981`) for earnings metrics
  - Badges & Text: Zero-pill discipline; crisp typographic hierarchy and subtle border dividers
- **Bank Selector UI**:
  - Searchable modal with categorized quick-select chips for OPay, PalmPay, Moniepoint, and Kuda, followed by an alphabetical list of all licensed Nigerian commercial banks.

---

### 3. Key Product Decisions & Trade-Offs

- **Calculation-Only Payout View**:
  - *Approach*: Clearly state to sellers that the dashboard displays real-time transaction calculations, while actual escrow release is handled automatically upon buyer delivery code verification.
  - *Why*: Eliminates confusion about whether the website is acting as a custodial deposit bank while giving sellers transparent arithmetic.
- **Searchable Nigerian Bank Roster**:
  - *Approach*: Include a pre-curated list of 25+ Nigerian financial institutions (fintechs, digital banks, and commercial banks) with search-as-you-type and custom bank fallback.
- **Floating Button vs. Banner**:
  - *Approach*: Keep the floating button persistent on screen for seamless mobile access while keeping the homepage catalog distraction-free.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Updated Component Flow                          │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Header.tsx & AbbasonLogo.tsx                                        │
│    └─► Brand image container beside "Abbason Hub"                      │
│    └─► Supports custom uploaded image file & fallback SVG              │
│                                                                        │
│ 2. SellerDashboard.tsx                                                 │
│    ├─► Active Tab: 'earnings' ("My Earnings")                          │
│    ├─► EarningsSummary (Pending Escrow, Commission Paid, Net Take-home)│
│    ├─► BankDetailsCard (Shows active bank: OPay/PalmPay/Commercial)    │
│    └─► BankSwitcherModal (Searchable bank selection & account update)  │
│                                                                        │
│ 3. App.tsx & WhatsAppContactModal.tsx                                  │
│    ├─► Remove large footer section; keep compact note                  │
│    └─► Phone number 08022201727 in floating button & contact modal    │
└────────────────────────────────────────────────────────────────────────┘
```

#### Key Implementation Changes
1. **`src/data/nigerianBanks.ts`**: Comprehensive directory of Nigerian financial institutions categorized by Fintech/Digital (OPay, PalmPay, Kuda, Moniepoint) and Commercial Banks.
2. **`src/components/SellerDashboard.tsx`**: Add the dedicated **My Earnings** tab with 3% commission calculations, itemized order ledger, and interactive bank switcher.
3. **`src/App.tsx`**: Remove the large banner section at the bottom, update phone references to `08022201727`, and preserve the floating WhatsApp button.
4. **`src/components/Header.tsx` & `src/components/AbbasonLogo.tsx`**: Update brand graphic beside "Abbason Hub" to integrate custom brand image capabilities.

---

### 5. Verification & Testing

- Verify calculation of 3% platform commission (capped at ₦2,000) on pending and settled orders.
- Test changing settlement bank to PalmPay, OPay, and commercial banks, confirming updated account details persist.
- Verify homepage footer layout without the large promo card.
- Confirm WhatsApp link and modal direct to `2348022201727`.
- Run `lint_applet` and `compile_applet` to ensure zero compilation or type errors.
