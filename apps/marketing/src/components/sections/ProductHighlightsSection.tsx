import * as React from "react";
import { Button } from "../ui/button";
import {
  products,
  phases,
  type Product,
  type ProductPhaseInfo,
} from "../../data/products";
import styles from "./ProductHighlightsSection.module.css";

// Featured products for landing page - Phase 1 highlights
const featuredProductIds = ["skysnare", "skywatch-standard", "netsnare-lite"];

// Default phase info for fallback
const DEFAULT_PHASE: ProductPhaseInfo = {
  id: "seed",
  name: "Coming Soon",
  shortName: "Soon",
  timeline: "TBD",
  funding: "TBD",
  color: "#6b7280",
  description: "Product information coming soon",
};

// Month name to number mapping
const MONTH_MAP: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

// Type guard for Product
function isProduct(value: Product | undefined): value is Product {
  return value !== undefined && value !== null;
}

// Parse launch date from phaseTimeline string
// First tries to parse explicit "Delivery MMM YYYY" format
// Falls back to calculating from quarter if not found
function parseLaunchDate(phaseTimeline: string): Date | null {
  if (phaseTimeline.toLowerCase().includes("available now")) {
    return null; // Already available
  }

  // Try to match explicit delivery date like "Delivery Jul 2026" or "Delivery Aug 2027"
  const deliveryMatch = phaseTimeline.match(
    /Delivery\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/i,
  );
  if (deliveryMatch) {
    const monthStr = deliveryMatch[1].toLowerCase();
    const year = parseInt(deliveryMatch[2], 10);
    const month = MONTH_MAP[monthStr];
    if (month !== undefined) {
      return new Date(Date.UTC(year, month, 1));
    }
  }

  // Fallback: calculate from quarter
  // Match patterns like "Q2 2026", "Q4 2026", etc.
  const quarterMatch = phaseTimeline.match(/Q([1-4])\s+(\d{4})/);
  if (quarterMatch) {
    const quarter = parseInt(quarterMatch[1], 10);
    const year = parseInt(quarterMatch[2], 10);

    // Validate quarter is 1-4
    if (quarter < 1 || quarter > 4) {
      return null;
    }

    // Quarter end month (0-indexed): Q1=2 (Mar), Q2=5 (Jun), Q3=8 (Sep), Q4=11 (Dec)
    // Then add 1 month for launch after development
    const quarterEndMonth = quarter * 3 - 1;
    const launchMonth = quarterEndMonth + 1; // +1 month after dev complete
    // Handle year rollover if month >= 12
    const adjustedYear = launchMonth >= 12 ? year + 1 : year;
    const adjustedMonth = launchMonth >= 12 ? launchMonth - 12 : launchMonth;
    return new Date(Date.UTC(adjustedYear, adjustedMonth, 1));
  }

  return null;
}

// Calculate preorder opens date (6 months before launch)
function getPreorderOpensDate(launchDate: Date): Date {
  const preorderDate = new Date(launchDate);
  preorderDate.setUTCMonth(preorderDate.getUTCMonth() - 6);
  return preorderDate;
}

// Format date for display (timezone-stable using UTC)
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

// Get preorder status for a product
// Takes currentDate as parameter to avoid stale date in SSR/SSG builds
function getPreorderStatus(
  product: Product,
  currentDate: Date,
): {
  canPreorder: boolean;
  canBuy: boolean;
  preorderOpensDate: Date | null;
  launchDate: Date | null;
  statusText: string;
} {
  // Already available for purchase
  if (product.available) {
    return {
      canPreorder: false,
      canBuy: true,
      preorderOpensDate: null,
      launchDate: null,
      statusText: "Available Now",
    };
  }

  const launchDate = parseLaunchDate(product.phaseTimeline);

  if (!launchDate) {
    return {
      canPreorder: false,
      canBuy: false,
      preorderOpensDate: null,
      launchDate: null,
      statusText: "Coming Soon",
    };
  }

  const preorderOpensDate = getPreorderOpensDate(launchDate);
  const canPreorder = currentDate >= preorderOpensDate;

  if (canPreorder) {
    return {
      canPreorder: true,
      canBuy: false,
      preorderOpensDate,
      launchDate,
      statusText: `Delivery ${formatDate(launchDate)}`,
    };
  }

  return {
    canPreorder: false,
    canBuy: false,
    preorderOpensDate,
    launchDate,
    statusText: `Preorder opens ${formatDate(preorderOpensDate)}`,
  };
}

// Get phase info safely with fallback
function getPhaseInfo(product: Product): ProductPhaseInfo {
  return phases[product.phase] ?? DEFAULT_PHASE;
}

// Get earliest delivery date from featured products
function getEarliestDeliveryDate(productList: Product[]): string {
  const launchDates = productList
    .map((p) => parseLaunchDate(p.phaseTimeline))
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime());

  if (launchDates.length > 0) {
    return formatDate(launchDates[0]);
  }
  return "2026";
}

/**
 * Renders a section showcasing Phase 1 highlighted products with availability status,
 * pricing, and preorder capabilities. Displays product cards with dynamic status badges
 * and action buttons based on launch timeline.
 */
export const ProductHighlightsSection: React.FC = () => {
  // Compute current date at render time to avoid stale SSR/SSG builds
  const currentDate = new Date();

  const featuredProducts = featuredProductIds
    .map((id) => products.find((p) => p.id === id))
    .filter(isProduct);

  const earliestDelivery = getEarliestDeliveryDate(featuredProducts);

  return (
    <section className={styles.section} id="products">
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.badge}>Phase 1 Products</span>
          <h2 className={styles.title}>Ready to Deploy</h2>
          <p className={styles.subtitle}>
            Preorder now with no deposit required. Delivery starts{" "}
            {earliestDelivery}.
          </p>
        </div>

        <div className={styles.productsGrid}>
          {featuredProducts.map((product) => {
            const phase = getPhaseInfo(product);
            const status = getPreorderStatus(product, currentDate);

            return (
              <div key={product.id} className={styles.productCard}>
                <div className={styles.productHeader}>
                  <div className={styles.productBadges}>
                    <span
                      className={styles.phaseBadge}
                      style={
                        { "--phase-color": phase.color } as React.CSSProperties
                      }
                    >
                      {phase.shortName}
                    </span>
                    {status.canBuy && (
                      <span className={styles.availableBadge}>
                        Available Now
                      </span>
                    )}
                    {status.canPreorder && (
                      <span className={styles.preorderBadge}>
                        Preorder Open
                      </span>
                    )}
                    {!status.canBuy && !status.canPreorder && (
                      <span className={styles.comingSoonBadge}>
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <span className={styles.productLine}>
                    {product.line.charAt(0).toUpperCase() +
                      product.line.slice(1)}
                  </span>
                </div>

                <h3 className={styles.productName}>{product.name}</h3>
                <p className={styles.productTagline}>{product.tagline}</p>
                <p className={styles.productDescription}>
                  {product.description}
                </p>

                <div className={styles.productSpecs}>
                  {Object.entries(product.specs)
                    .slice(0, 3)
                    .map(([key, value]) => (
                      <div key={key} className={styles.spec}>
                        <span className={styles.specLabel}>
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </span>
                        <span className={styles.specValue}>{value}</span>
                      </div>
                    ))}
                </div>

                <div className={styles.productFooter}>
                  <div className={styles.priceSection}>
                    <span className={styles.price}>
                      {product.priceFormatted}
                    </span>
                    <span className={styles.statusText}>
                      {status.statusText}
                    </span>
                  </div>
                  <div className={styles.productActions}>
                    {status.canBuy && (
                      <Button
                        href="/contact"
                        size="md"
                        variant="primary"
                        trackingEvent="Buy Clicked"
                        trackingProps={{
                          location: "product-highlights",
                          product: product.id,
                        }}
                      >
                        Buy Now
                      </Button>
                    )}
                    {status.canPreorder && (
                      <Button
                        href="/preorder"
                        size="md"
                        variant="primary"
                        trackingEvent="Preorder Clicked"
                        trackingProps={{
                          location: "product-highlights",
                          product: product.id,
                        }}
                      >
                        Preorder Now
                      </Button>
                    )}
                    {!status.canBuy && !status.canPreorder && (
                      <Button
                        href={`/products#${product.id}`}
                        size="md"
                        variant="secondary"
                        trackingEvent="Product Notify Clicked"
                        trackingProps={{
                          location: "product-highlights",
                          product: product.id,
                        }}
                      >
                        Notify Me
                      </Button>
                    )}
                    <Button
                      href={`/products#${product.id}`}
                      size="md"
                      variant="ghost"
                      trackingEvent="Product Details Viewed"
                      trackingProps={{
                        location: "product-highlights",
                        product: product.id,
                      }}
                    >
                      Details
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.ctaSection}>
          <p className={styles.ctaText}>
            Looking for enterprise solutions or custom deployments?
          </p>
          <div className={styles.ctaButtons}>
            <Button
              href="/products"
              size="lg"
              variant="secondary"
              trackingEvent="Products Clicked"
              trackingProps={{ location: "product-highlights", type: "all" }}
            >
              View All Products
            </Button>
            <Button
              href="/preorder"
              size="lg"
              variant="primary"
              trackingEvent="Preorder Clicked"
              trackingProps={{ location: "product-highlights", type: "cta" }}
            >
              Preorder Now - No Deposit
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
