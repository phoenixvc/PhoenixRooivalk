import * as React from "react";
import { Button } from "../ui/button";
import { products, phases } from "../../data/products";
import styles from "./ProductHighlightsSection.module.css";

// Featured products for landing page - Phase 1 highlights
const featuredProductIds = ["skysnare", "skywatch-standard", "netsnare-lite"];

export const ProductHighlightsSection: React.FC = () => {
  const featuredProducts = featuredProductIds
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean);

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
            if (!product) return null;
            const phase = phases[product.phase];

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
                    {product.available && (
                      <span className={styles.availableBadge}>
                        Available Now
                      </span>
                    )}
                    {product.comingSoon && !product.available && (
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
                    <span className={styles.price}>{product.priceFormatted}</span>
                    {product.monthlyFee && (
                      <span className={styles.monthlyFee}>
                        + ${(product.monthlyFee / 1000).toFixed(0)}K/mo
                      </span>
                    )}
                  </div>
                  <div className={styles.productActions}>
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
                      {product.available ? "Buy Now" : "Preorder"}
                    </Button>
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
