"use client";
import Link from "next/link";
import * as React from "react";
import { Footer } from "../../components/Footer";
import { Navigation } from "../../components/Navigation";
import { Button } from "../../components/ui/button";
import {
  products,
  productLines,
  phases,
  type ProductLine,
  type Product,
} from "../../data/products";
import styles from "./products.module.css";

const productLineOrder: ProductLine[] = [
  "skysnare",
  "netsnare",
  "skywatch",
  "netsentry",
  "aeronet",
  "rkv",
];

function ProductCard({ product }: { product: Product }) {
  const phase = phases[product.phase];

  return (
    <div className={styles.productCard}>
      <div className={styles.productHeader}>
        <div className={styles.productBadges}>
          <span
            className={styles.phaseBadge}
            style={{ backgroundColor: phase.color }}
          >
            {phase.shortName}
          </span>
          {product.comingSoon && (
            <span className={styles.comingSoonBadge}>Coming Soon</span>
          )}
        </div>
        <h3 className={styles.productName}>{product.name}</h3>
        <p className={styles.productTagline}>{product.tagline}</p>
      </div>

      <div className={styles.productPrice}>
        <span className={styles.priceValue}>{product.priceFormatted}</span>
        {product.monthlyFee && (
          <span className={styles.monthlyFee}>
            + ${product.monthlyFee}/mo subscription
          </span>
        )}
      </div>

      <p className={styles.productDescription}>{product.description}</p>

      <div className={styles.productSpecs}>
        {Object.entries(product.specs).map(([key, value]) =>
          value ? (
            <div key={key} className={styles.specItem}>
              <span className={styles.specLabel}>{key}:</span>
              <span className={styles.specValue}>{value}</span>
            </div>
          ) : null,
        )}
      </div>

      <ul className={styles.featureList}>
        {product.features.slice(0, 4).map((feature) => (
          <li key={feature} className={styles.featureItem}>
            <span className={styles.featureBullet}>+</span>
            {feature}
          </li>
        ))}
      </ul>

      <div className={styles.productFooter}>
        <span className={styles.deliveryInfo}>{product.phaseTimeline}</span>
        <Link href="/contact" className={styles.preorderLink}>
          Preorder Now
        </Link>
      </div>
    </div>
  );
}

function ProductLineSection({ lineId }: { lineId: ProductLine }) {
  const lineInfo = productLines[lineId];
  const lineProducts = products.filter((p) => p.line === lineId);

  if (lineProducts.length === 0) return null;

  return (
    <section id={lineId} className={styles.productLineSection}>
      <div className={styles.lineHeader}>
        <span className={styles.lineIcon}>{lineInfo.icon}</span>
        <div>
          <h2 className={styles.lineName}>{lineInfo.name}</h2>
          <p className={styles.lineTagline}>{lineInfo.tagline}</p>
        </div>
      </div>
      <p className={styles.lineDescription}>{lineInfo.description}</p>

      <div className={styles.productsGrid}>
        {lineProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

export default function ProductsPage(): React.ReactElement {
  return (
    <main className={styles.main}>
      {/* Background */}
      <div className={styles.background}>
        <div className={styles.gridPattern} />
      </div>

      {/* Navigation */}
      <Navigation />

      {/* Header */}
      <section className={styles.headerSection}>
        <div className={styles.container}>
          <h1 className={styles.title}>Product Catalog</h1>
          <p className={styles.subtitle}>
            From consumer drone defense to enterprise security platforms. Browse
            our complete product lineup spanning five development phases.
          </p>

          {/* Quick Nav */}
          <div className={styles.quickNav}>
            {productLineOrder.map((lineId) => {
              const line = productLines[lineId];
              return (
                <a
                  key={lineId}
                  href={`#${lineId}`}
                  className={styles.quickNavItem}
                >
                  <span className={styles.quickNavIcon}>{line.icon}</span>
                  <span className={styles.quickNavLabel}>{line.name}</span>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Phase Overview */}
      <section className={styles.phaseOverview}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Development Phases</h2>
          <div className={styles.phaseGrid}>
            {Object.values(phases).map((phase) => (
              <div key={phase.id} className={styles.phaseCard}>
                <div
                  className={styles.phaseIndicator}
                  style={{ backgroundColor: phase.color }}
                />
                <div className={styles.phaseInfo}>
                  <h3 className={styles.phaseName}>{phase.shortName}</h3>
                  <p className={styles.phaseTimeline}>{phase.timeline}</p>
                  <p className={styles.phaseFunding}>
                    Funding: {phase.funding}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Lines */}
      <div className={styles.productLinesContainer}>
        <div className={styles.container}>
          {productLineOrder.map((lineId) => (
            <ProductLineSection key={lineId} lineId={lineId} />
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <h2 className={styles.ctaTitle}>Ready to Secure Your Airspace?</h2>
          <p className={styles.ctaSubtitle}>
            Preorder now with no deposit required. Be among the first to receive
            our revolutionary counter-drone technology.
          </p>
          <div className={styles.ctaButtons}>
            <Button href="/contact" size="lg" variant="primary">
              Preorder Now - No Deposit
            </Button>
            <Button href="/contact" variant="secondary" size="lg">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}
