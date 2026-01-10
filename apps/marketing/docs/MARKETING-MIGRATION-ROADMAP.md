# Marketing Frontend Migration Roadmap

**Version:** 1.0
**Date:** 2026-01-10
**Status:** Planning

---

## Executive Summary

This roadmap outlines the migration plan to align the marketing frontend with the complete product catalog, making it more consumer-friendly while maintaining enterprise appeal. The goal is to create a unified product presentation that scales from SkySnare consumer products to AeroNet enterprise solutions and RKV military systems.

---

## Current State Analysis

### Existing Marketing Structure

```
apps/marketing/
├── src/app/                    # Next.js pages
│   ├── page.tsx               # Landing page (B2B focused)
│   ├── capabilities/          # Technical capabilities
│   ├── technical/             # Detailed specs
│   ├── interactive-demo/      # Threat simulator
│   ├── roi-calculator/        # ROI tool
│   └── contact/               # Contact form
├── src/components/
│   ├── sections/              # Page sections
│   └── ui/                    # UI components
└── src/data/
    └── effectorDatabase.json  # Effector data
```

### Gap Analysis

| Area | Current State | Needed | Priority |
|------|---------------|--------|----------|
| Product Pages | None | Individual product pages | HIGH |
| Consumer Focus | B2B only | B2C + B2B | HIGH |
| Product Data | Scattered | Unified `products.ts` | DONE |
| Pricing Display | ROI calculator only | Product pricing pages | HIGH |
| Phase Timeline | Hidden | Visual roadmap | MEDIUM |
| Shop Integration | None | E-commerce for SkySnare | HIGH |
| Product Compare | None | Side-by-side comparison | MEDIUM |
| **Preorder System** | **None** | **All products preorderable** | **HIGH** |
| **Bulk Orders** | **None** | **Volume pricing & quotes** | **HIGH** |

---

## Migration Phases

### Phase 1: Data Alignment (Week 1) ✅ COMPLETED

**Deliverables:**
- [x] Create unified `products.ts` data file
- [x] Add phases to all products in catalog
- [x] Create `tariffs.ts` with pricing/labor data
- [x] Add missing products (SkySnare, AeroNet, RKV)

**Files Created:**
- `apps/marketing/src/data/products.ts`
- `apps/docs/src/data/tariffs.ts`

---

### Phase 2: Consumer Landing Experience (Weeks 2-3)

**Goal:** Create consumer-friendly entry point for SkySnare

#### 2.1 New Routes

```
/shop                    # Product catalog overview
/shop/skysnare           # SkySnare product page
/shop/skywatch           # SkyWatch line overview
/shop/netsentry          # NetSentry line overview
/products                # Full product catalog
/products/[slug]         # Individual product pages
/compare                 # Product comparison tool
```

#### 2.2 Component Updates

**Hero Section Redesign:**
```tsx
// Current: B2B-focused hero
// New: Dual-track hero with consumer/enterprise paths

<HeroSection>
  <ConsumerPath>
    "Protect Your Privacy"
    → Shop SkySnare ($349)
  </ConsumerPath>

  <EnterprisePath>
    "Defend Your Infrastructure"
    → Schedule Demo
  </EnterprisePath>
</HeroSection>
```

**New Components Needed:**
- `ProductCard.tsx` - Product display card
- `ProductGrid.tsx` - Grid of products
- `ProductHero.tsx` - Product page hero
- `PricingTable.tsx` - Pricing display
- `PhaseTimeline.tsx` - Visual roadmap
- `CompareTable.tsx` - Side-by-side comparison
- `AvailabilityBadge.tsx` - Available/Coming Soon badge

#### 2.3 Navigation Updates

```tsx
// Updated Navigation Structure
Products (Dropdown)
├── SkySnare - Consumer           [NEW]
├── SkyWatch - Detection          [NEW]
├── NetSentry - Countermeasures   [NEW]
├── AeroNet - Enterprise          [NEW]
├── Compare Products              [NEW]
└── Full Catalog                  [NEW]

Technology (Existing)
├── Interactive Demo
├── Technical Specs
└── Defense Methods

Business (Existing)
├── ROI Calculator
├── Development Timeline
└── Schedule Meeting
```

---

### Phase 3: Product Pages (Weeks 3-4)

**Goal:** Individual product pages with buy/inquiry actions

#### 3.1 Product Page Template

```
/products/[slug]
├── Hero (name, tagline, price, CTA)
├── Gallery (images, video)
├── Specs Table
├── Features List
├── Use Cases
├── Phase/Availability
├── Related Products
└── CTA (Buy/Contact)
```

#### 3.2 Page Generation

```tsx
// Dynamic product pages from products.ts
export async function generateStaticParams() {
  return products.map((product) => ({
    slug: product.id,
  }));
}
```

#### 3.3 Consumer vs Enterprise Styling

| Element | Consumer (SkySnare) | Enterprise (AeroNet) |
|---------|---------------------|----------------------|
| Tone | Friendly, casual | Professional, formal |
| CTA | "Buy Now", "Add to Cart" | "Schedule Demo", "Contact Sales" |
| Pricing | Direct display | "Contact for Quote" |
| Colors | Bright, energetic | Subdued, trustworthy |
| Images | Lifestyle, outdoor | Industrial, professional |

---

### Phase 4: E-commerce Integration (Weeks 5-6)

**Goal:** Enable direct purchase for consumer products

#### 4.1 Shop Infrastructure

```
/shop
├── /shop/skysnare          # Main SkySnare page
├── /shop/skysnare/buy      # Checkout flow
├── /shop/cart              # Shopping cart
└── /shop/checkout          # Checkout page
```

#### 4.2 Integration Options

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| Shopify Buy Button | Quick setup, hosted checkout | Limited customization | Phase 1 |
| Stripe Checkout | Full control, lower fees | More dev work | Phase 2 |
| Self-hosted | Maximum control | Complex, compliance | Future |

#### 4.3 Implementation Steps

1. **Week 5:**
   - Set up Shopify store for SkySnare
   - Integrate Buy Button SDK
   - Create cart component

2. **Week 6:**
   - Implement checkout flow
   - Add order confirmation
   - Set up email notifications

---

### Phase 4B: Preorder System (Weeks 5-6)

**Goal:** Enable preorders for ALL products with staged payment terms

#### 4B.1 Preorder Overview

All products (not just available ones) will be preorderable. This allows customers to reserve products scheduled for future phases with clear delivery expectations and payment terms.

```
┌─────────────────────────────────────────────────────────────────────┐
│                     PREORDER PAYMENT TIMELINE                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  PREORDER         LAUNCH DATE        1 MONTH           SHIPPING     │
│  PLACED           CONFIRMED          BEFORE SHIP       DATE         │
│     │                 │                  │                │          │
│     ▼                 ▼                  ▼                ▼          │
│   ┌───┐            ┌───┐             ┌───┐            ┌───┐         │
│   │$0 │            │50%│             │50%│            │100%│         │
│   │   │            │DUE│             │DUE│            │PAID│         │
│   └───┘            └───┘             └───┘            └───┘         │
│     │                 │                  │                │          │
│  No deposit       Payment 1          Payment 2       Full payment   │
│  required         invoice sent       if not paid     before ship    │
│                                                                      │
│  DELIVERY: 1 month after scheduled phase completion                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### 4B.2 Payment Terms

| Stage | Timing | Amount | Notes |
|-------|--------|--------|-------|
| **Preorder Placement** | At order | $0 | No deposit required |
| **Payment 1** | Launch date confirmed | 50% | Invoice sent when product line launch date announced |
| **Payment 1 Due** | 1 month before shipping | 50% | Must be paid to hold reservation |
| **Payment 2 / Final** | Before shipping | Remaining 50% | Full payment required before dispatch |

#### 4B.3 Delivery Timeline

```
Phase Completion + 1 Month = Estimated Delivery

Example: SkyWatch Marine (Series A Q4 2026)
├── Phase completion: December 2026
├── Estimated delivery: January 2027
└── Launch confirmation: ~3 months before (September 2026)
    └── 50% payment due: December 2026 (1 month before shipping)
```

**Product Delivery Estimates:**

| Product | Phase | Phase Completion | Est. Delivery |
|---------|-------|------------------|---------------|
| SkySnare | Seed | Q1 2026 | Feb 2026 |
| SkyWatch Mobile | Series A | Q2 2026 | Jul 2026 |
| SkyWatch Thermal | Series A | Q3 2026 | Oct 2026 |
| NetSentry Standard | Series A | Q3 2026 | Oct 2026 |
| SkyWatch Marine | Series A | Q4 2026 | Jan 2027 |
| SkyWatch Mesh | Series A | Q4 2026 | Jan 2027 |
| NetSentry Pro | Series A | Q4 2026 | Jan 2027 |
| AeroNet Enterprise | Series A | Q4 2026 | Jan 2027 |
| SkyWatch Enterprise | Series A | 2027 | Feb 2027 |
| RKV-G Ground Station | Series B | 2028 | Feb 2028 |
| RKV-M Mothership | Series C | 2029 | Feb 2029 |
| RKV-I Interceptor | Series C | 2029 | Feb 2029 |

#### 4B.4 Preorder Routes

```
/preorder                       # Preorder landing page
/preorder/[product-slug]        # Product preorder page
/preorder/bulk                  # Bulk order inquiry
/preorder/status                # Check preorder status
/preorder/manage                # Manage existing preorders
/account/preorders              # User's preorder dashboard
```

#### 4B.5 Bulk Order System

**Bulk Order Tiers:**

| Quantity | Discount | Process |
|----------|----------|---------|
| 1-4 units | Standard pricing | Self-service checkout |
| 5-9 units | 5% discount | Self-service with auto-discount |
| 10-24 units | 10% discount | Self-service or quote request |
| 25-49 units | 15% discount | Quote required |
| 50+ units | Custom pricing | Sales contact required |

**Bulk Order Features:**
- Volume discount calculator on product pages
- Quick quote request form
- Dedicated account manager for 25+ units
- Custom delivery scheduling
- Split shipment options
- NET-30/60/90 terms for qualified enterprises

#### 4B.6 Preorder UI Components

**New Components Needed:**

```tsx
// Preorder-specific components
├── PreorderBanner.tsx          // "Preorder Now - No Deposit Required"
├── PreorderButton.tsx          // CTA with delivery estimate
├── PreorderTimeline.tsx        // Visual payment timeline
├── DeliveryEstimate.tsx        // Shows phase + 1 month
├── PaymentTermsCard.tsx        // Explains payment structure
├── BulkOrderCalculator.tsx     // Volume pricing tool
├── PreorderStatusBadge.tsx     // Order status indicator
└── PreorderConfirmation.tsx    // Confirmation with timeline
```

**PreorderButton States:**

```tsx
// Available product
<PreorderButton variant="buy">
  Buy Now - $349
</PreorderButton>

// Coming soon product
<PreorderButton variant="preorder">
  Preorder Now - $349
  <small>No deposit • Est. delivery: Jul 2026</small>
</PreorderButton>

// Future phase product
<PreorderButton variant="reserve">
  Reserve Now - $65,000
  <small>No deposit • Est. delivery: Feb 2029</small>
</PreorderButton>
```

#### 4B.7 Email Automation

**Preorder Email Sequence:**

| Trigger | Email | Content |
|---------|-------|---------|
| Preorder placed | Confirmation | Order details, timeline, $0 charged |
| Launch date announced | Payment Request | 50% invoice, due date, payment link |
| 2 weeks before due | Reminder | Payment reminder, deadline |
| Payment received | Receipt | Confirmation, updated timeline |
| 1 week before ship | Final Payment | Remaining balance due |
| Shipped | Tracking | Tracking info, delivery ETA |

#### 4B.8 Preorder Data Model

```typescript
interface Preorder {
  id: string;
  productId: string;
  productSku: string;
  customerId: string;

  // Order details
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount: number;         // Bulk discount applied

  // Status
  status: PreorderStatus;   // 'reserved' | 'payment_pending' | 'partial_paid' | 'paid' | 'shipped' | 'delivered' | 'cancelled'

  // Payment tracking
  depositPaid: number;      // Always 0 initially
  payment1Paid: number;     // 50% when launch confirmed
  payment2Paid: number;     // Remaining 50%
  totalPaid: number;

  // Dates
  createdAt: Date;
  phaseCompletionDate: Date | null;
  launchConfirmedDate: Date | null;
  payment1DueDate: Date | null;
  shippingDate: Date | null;
  estimatedDelivery: Date | null;

  // Bulk order
  isBulkOrder: boolean;
  bulkTier: string | null;
}

type PreorderStatus =
  | 'reserved'          // Preorder placed, no payment yet
  | 'payment_pending'   // Launch confirmed, awaiting 50%
  | 'partial_paid'      // 50% received, awaiting final
  | 'paid'              // Fully paid, awaiting shipping
  | 'shipped'           // In transit
  | 'delivered'         // Complete
  | 'cancelled';        // Cancelled by customer/admin
```

#### 4B.9 Preorder Page Messaging

**Clear Communication Required:**

```
┌─────────────────────────────────────────────────────────────────┐
│  🎯 PREORDER: SkyWatch Thermal                                  │
│                                                                  │
│  Price: $400 - $1,500                                           │
│  Phase: Series A (Q3 2026)                                      │
│  Estimated Delivery: October 2026                               │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  💳 PAYMENT TERMS                                        │   │
│  │                                                          │   │
│  │  ✓ No deposit required to reserve                       │   │
│  │  ✓ 50% due when launch date confirmed (~3 months out)   │   │
│  │  ✓ Payment deadline: 1 month before shipping            │   │
│  │  ✓ Remaining 50% due before shipping                    │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  [Preorder Now - Reserve Your Unit]                             │
│                                                                  │
│  ⚡ 47 others viewing • 12 preorders this week                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### Phase 5: Enterprise Experience (Weeks 7-8)

**Goal:** Professional enterprise journey with demo scheduling

#### 5.1 AeroNet Dedicated Section

```
/enterprise
├── /enterprise/aeronet     # AeroNet platform page
├── /enterprise/demo        # Interactive demo
├── /enterprise/roi         # ROI calculator
├── /enterprise/case-studies # Customer success
└── /enterprise/contact     # Enterprise contact
```

#### 5.2 Lead Capture Improvements

- Enhanced contact forms with qualification questions
- Calendly/Cal.com integration for demos
- CRM integration (HubSpot/Salesforce)
- Lead scoring based on company size/industry

---

### Phase 6: Visual Polish (Weeks 9-10)

**Goal:** Consistent branding and premium feel

#### 6.1 Design System Updates

```tsx
// Product Line Colors
const productColors = {
  skysnare: "#22c55e",   // Green - Consumer friendly
  skywatch: "#3b82f6",   // Blue - Trust/reliability
  netsentry: "#f59e0b",  // Amber - Action/alert
  aeronet: "#8b5cf6",    // Purple - Premium/enterprise
  rkv: "#ef4444",        // Red - Military/defense
};
```

#### 6.2 Asset Requirements

| Asset Type | SkySnare | SkyWatch | NetSentry | AeroNet | RKV |
|------------|----------|----------|-----------|---------|-----|
| Hero Image | ✅ Needed | ✅ Needed | ✅ Needed | ✅ Needed | ✅ Needed |
| Product Photos | 5+ | 3+ per | 3+ per | 5+ | Renders |
| Lifestyle | 3+ | 2+ | 2+ | 2+ | - |
| Video | Demo | Overview | Demo | Full | - |
| Icons | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Implementation Checklist

### Phase 1: Data ✅
- [x] Create `products.ts`
- [x] Add phases to catalog
- [x] Create `tariffs.ts`
- [x] Add SkySnare, AeroNet, RKV products

### Phase 2: Consumer Landing
- [ ] Create `/shop` route
- [ ] Create `/shop/skysnare` page
- [ ] Update hero section
- [ ] Add consumer navigation path
- [ ] Create `ProductCard` component
- [ ] Create `AvailabilityBadge` component

### Phase 3: Product Pages
- [ ] Create `/products/[slug]` dynamic route
- [ ] Build product page template
- [ ] Add product gallery component
- [ ] Create specs table component
- [ ] Add related products section
- [ ] Build comparison page `/compare`

### Phase 4: E-commerce
- [ ] Set up Shopify store
- [ ] Integrate Buy Button
- [ ] Create cart component
- [ ] Build checkout flow
- [ ] Add order confirmation

### Phase 4B: Preorder System
- [ ] Create `/preorder` routes
- [ ] Build `PreorderButton` component
- [ ] Create `PreorderTimeline` component
- [ ] Implement `PaymentTermsCard` component
- [ ] Build `BulkOrderCalculator` component
- [ ] Create preorder confirmation flow
- [ ] Set up preorder email automation
- [ ] Implement preorder status tracking
- [ ] Build bulk order quote system
- [ ] Add volume discount calculator
- [ ] Create preorder management dashboard

### Phase 5: Enterprise
- [ ] Create `/enterprise` section
- [ ] Build AeroNet dedicated page
- [ ] Enhance demo scheduling
- [ ] Add case studies section
- [ ] Implement lead scoring

### Phase 6: Polish
- [ ] Update color system
- [ ] Create/source product images
- [ ] Add product videos
- [ ] Implement animations
- [ ] Mobile optimization
- [ ] Performance optimization

---

## File Changes Summary

### New Files to Create

```
apps/marketing/
├── src/app/
│   ├── shop/
│   │   ├── page.tsx                    # Shop landing
│   │   ├── skysnare/
│   │   │   └── page.tsx               # SkySnare product
│   │   ├── cart/
│   │   │   └── page.tsx               # Shopping cart
│   │   └── checkout/
│   │       └── page.tsx               # Checkout
│   ├── products/
│   │   ├── page.tsx                   # Full catalog
│   │   └── [slug]/
│   │       └── page.tsx               # Product detail
│   ├── compare/
│   │   └── page.tsx                   # Comparison tool
│   ├── preorder/
│   │   ├── page.tsx                   # Preorder landing
│   │   ├── [slug]/
│   │   │   └── page.tsx               # Product preorder
│   │   ├── bulk/
│   │   │   └── page.tsx               # Bulk order inquiry
│   │   ├── status/
│   │   │   └── page.tsx               # Check status
│   │   └── manage/
│   │       └── page.tsx               # Manage preorders
│   ├── account/
│   │   └── preorders/
│   │       └── page.tsx               # User preorder dashboard
│   └── enterprise/
│       ├── page.tsx                   # Enterprise landing
│       └── aeronet/
│           └── page.tsx               # AeroNet detail
├── src/components/
│   ├── products/
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── ProductHero.tsx
│   │   ├── ProductSpecs.tsx
│   │   ├── ProductGallery.tsx
│   │   ├── ProductFeatures.tsx
│   │   ├── PricingDisplay.tsx
│   │   ├── AvailabilityBadge.tsx
│   │   └── CompareTable.tsx
│   ├── shop/
│   │   ├── CartButton.tsx
│   │   ├── CartDrawer.tsx
│   │   ├── BuyButton.tsx
│   │   └── CheckoutForm.tsx
│   ├── preorder/
│   │   ├── PreorderBanner.tsx
│   │   ├── PreorderButton.tsx
│   │   ├── PreorderTimeline.tsx
│   │   ├── DeliveryEstimate.tsx
│   │   ├── PaymentTermsCard.tsx
│   │   ├── BulkOrderCalculator.tsx
│   │   ├── PreorderStatusBadge.tsx
│   │   ├── PreorderConfirmation.tsx
│   │   └── VolumeDiscountTable.tsx
│   └── timeline/
│       └── PhaseTimeline.tsx
└── src/data/
    └── products.ts                    # ✅ CREATED
```

### Files to Modify

```
apps/marketing/src/
├── app/
│   └── page.tsx                       # Update hero section
├── components/
│   ├── Navigation.tsx                 # Add Products dropdown
│   ├── Footer.tsx                     # Add product links
│   └── sections/
│       └── HeroSection.tsx            # Dual-track hero
└── config/
    └── constants.ts                   # Add product routes
```

---

## Success Metrics

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| Consumer conversion | N/A | 2% | 3 months |
| Time on product pages | N/A | >3 min | 2 months |
| Demo requests | ~5/week | 15/week | 3 months |
| Cart abandonment | N/A | <70% | 3 months |
| Mobile traffic | 30% | 50% | 2 months |
| **Preorder conversion** | **N/A** | **5%** | **3 months** |
| **Bulk order inquiries** | **N/A** | **10/month** | **3 months** |
| **Preorder→Payment** | **N/A** | **>80%** | **6 months** |

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Consumer/B2B confusion | HIGH | Clear visual separation, distinct CTAs |
| Price sensitivity | MEDIUM | Value proposition messaging, testimonials |
| Product availability | HIGH | Clear "Coming Soon" badges, waitlist |
| Technical complexity | MEDIUM | Simplified consumer messaging |
| Mobile experience | HIGH | Mobile-first design approach |

---

## Timeline Summary

```
Week 1:     ✅ Data Alignment (COMPLETED)
Week 2-3:   Consumer Landing & Navigation
Week 3-4:   Product Pages & Comparison
Week 5-6:   E-commerce & Preorder System
Week 7-8:   Enterprise Experience
Week 9-10:  Visual Polish & Launch
```

**Target Launch:** Consumer shop in 4 weeks, Full migration in 10 weeks

### Preorder System Timeline

| Week | Preorder Deliverable |
|------|---------------------|
| 5 | Preorder routes, PreorderButton, DeliveryEstimate |
| 5 | PaymentTermsCard, PreorderTimeline |
| 6 | BulkOrderCalculator, VolumeDiscountTable |
| 6 | Email automation setup |
| 6 | Preorder status tracking |
| 7 | Bulk order quote system |
| 7 | Preorder management dashboard |

---

## Next Steps

1. **Immediate (This Week):**
   - [ ] Review and approve this roadmap
   - [ ] Begin Phase 2 component development
   - [ ] Source/create SkySnare hero images
   - [ ] Define preorder email templates

2. **Short-term (Next 2 Weeks):**
   - [ ] Complete consumer landing page
   - [ ] Build product page template
   - [ ] Set up Shopify store
   - [ ] Build PreorderButton component

3. **Medium-term (Month 2):**
   - [ ] Launch SkySnare shop with preorders
   - [ ] Complete preorder system
   - [ ] Launch bulk order inquiry system
   - [ ] Complete enterprise section
   - [ ] Full catalog with preorders live

---

*Document maintained by: Engineering Team*
*Last updated: 2026-01-10*
