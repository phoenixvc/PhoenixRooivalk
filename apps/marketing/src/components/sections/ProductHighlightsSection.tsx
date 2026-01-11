import * as React from "react";
import { Button } from "../ui/button";
import { products, phases, type Product } from "../../data/products";
import styles from "./ProductHighlightsSection.module.css";

// Featured products for landing page - Phase 1 highlights
const featuredProductIds = ["skysnare", "skywatch-standard", "netsnare-lite"];

// Current date for preorder calculations
const CURRENT_DATE = new Date("2026-01-11");

// Parse launch date from phaseTimeline string
// Launch dates are adjusted by +1 quarter from the stated timeline
function parseLaunchDate(phaseTimeline: string): Date | null {
  if (phaseTimeline.toLowerCase().includes("available now")) {
    return null; // Already available
  }

  // Match patterns like "Q2 2026", "Q4 2026", etc.
  const quarterMatch = phaseTimeline.match(/Q(\d)\s+(\d{4})/);
  if (quarterMatch) {
    const quarter = parseInt(quarterMatch[1], 10);
    const year = parseInt(quarterMatch[2], 10);
    // Q1 = Jan, Q2 = Apr, Q3 = Jul, Q4 = Oct
    // Add 1 quarter (3 months) to adjust launch dates
    const month = (quarter - 1) * 3 + 3;
    // Handle year rollover if month >= 12
    const adjustedYear = month >= 12 ? year + 1 : year;
    const adjustedMonth = month >= 12 ? month - 12 : month;
    return new Date(adjustedYear, adjustedMonth, 1);
  }

  return null;
}

// Calculate preorder opens date (6 months before launch)
function getPreorderOpensDate(launchDate: Date): Date {
  const preorderDate = new Date(launchDate);
  preorderDate.setMonth(preorderDate.getMonth() - 6);
  return preorderDate;
}

// Format date for display
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

// Get preorder status for a product
function getPreorderStatus(product: Product): {
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
  const canPreorder = CURRENT_DATE >= preorderOpensDate;

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

export const ProductHighlightsSection: React.FC = () => {
  const featuredProducts = featuredProductIds
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean) as Product[];

  return (
    <section className={styles.section} id="products">
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.badge}>Phase 1 Products</span>
          <h2 className={styles.title}>Ready to Deploy</h2>
          <p className={styles.subtitle}>
            Preorder now with no deposit required. Delivery starts Q2 2026.
          </p>
        </div>

        <div className={styles.productsGrid}>
          {featuredProducts.map((product) => {
            const phase = phases[product.phase];
            const status = getPreorderStatus(product);

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
                      <span className={styles.comingSoonBadge}>Coming Soon</span>
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
                    <span className={styles.statusText}>{status.statusText}</span>
                  </div>
                  <div className={styles.productActions}>
                    {status.canBuy && (
                      <Button
                        href="/preorder"
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
