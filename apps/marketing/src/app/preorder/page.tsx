"use client";

import React, { useState } from "react";
import { Navigation } from "../../components/Navigation";
import { Footer } from "../../components/Footer";
import { CartItem } from "../../components/cart/CartItem";
import { useCart } from "../../contexts/CartContext";
import { products, type Product } from "../../data/products";
import styles from "./preorder.module.css";

interface ProductQuantity {
  [productId: string]: number;
}

export default function PreorderPage(): React.ReactElement {
  const { items, total, addItem, clearCart } = useCart();
  const [quantities, setQuantities] = useState<ProductQuantity>({});
  const [showCheckout, setShowCheckout] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    notes: "",
  });

  // Filter to show only available products or coming soon
  const availableProducts = products.filter(
    (p) => p.available || p.comingSoon,
  );

  const getQuantity = (productId: string) => quantities[productId] || 1;

  const handleQuantityChange = (productId: string, delta: number) => {
    const current = getQuantity(productId);
    const newQuantity = Math.max(1, current + delta);
    setQuantities({ ...quantities, [productId]: newQuantity });
  };

  const handleAddToCart = (product: Product) => {
    const quantity = getQuantity(product.id);
    addItem(
      {
        id: product.id,
        sku: product.sku,
        name: product.name,
        price: product.priceRange.min,
        phaseTimeline: product.phaseTimeline,
        monthlyFee: product.monthlyFee,
      },
      quantity,
    );
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the order to your backend
    console.log("Order submitted:", { cart: items, customer: formData });
    alert(
      "Thank you for your preorder! We'll contact you shortly to confirm details.",
    );
    clearCart();
    setShowCheckout(false);
  };

  const handleProceedToCheckout = () => {
    setShowCheckout(true);
    // Scroll to checkout section
    setTimeout(() => {
      document
        .getElementById("checkout-section")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <main className={styles.main}>
      {/* Background */}
      <div className={styles.background}>
        <div className={styles.gridPattern} />
      </div>

      {/* Navigation */}
      <Navigation />

      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Preorder Products</h1>
          <p className={styles.subtitle}>
            Reserve your counter-drone defense systems today. No deposit
            required. Be among the first to receive our revolutionary
            technology.
          </p>
        </div>

        {/* Main Content */}
        <div className={styles.content}>
          {/* Products Section */}
          <div className={styles.productsSection}>
            <h2 className={styles.sectionTitle}>
              <svg
                className={styles.sectionIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
              Available Products
            </h2>

            <div className={styles.productsGrid}>
              {availableProducts.map((product) => (
                <div key={product.id} className={styles.productCard}>
                  <div className={styles.productHeader}>
                    <div className={styles.productInfo}>
                      <h3 className={styles.productName}>{product.name}</h3>
                      <p className={styles.productPhase}>
                        {product.phaseTimeline}
                      </p>
                      <div>
                        <div className={styles.productPrice}>
                          {product.priceFormatted}
                        </div>
                        {product.monthlyFee && (
                          <div className={styles.monthlyFee}>
                            + ${product.monthlyFee}/mo subscription
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className={styles.productDescription}>
                    {product.description}
                  </p>

                  <div className={styles.productActions}>
                    <div
                      className={styles.quantityControls}
                      role="group"
                      aria-label="Quantity"
                    >
                      <button
                        className={styles.quantityButton}
                        onClick={() => handleQuantityChange(product.id, -1)}
                        aria-label="Decrease quantity"
                        type="button"
                        disabled={getQuantity(product.id) <= 1}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          aria-hidden="true"
                        >
                          <line x1="4" y1="8" x2="12" y2="8" />
                        </svg>
                      </button>
                      <span className={styles.quantityValue}>
                        {getQuantity(product.id)}
                      </span>
                      <button
                        className={styles.quantityButton}
                        onClick={() => handleQuantityChange(product.id, 1)}
                        aria-label="Increase quantity"
                        type="button"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          aria-hidden="true"
                        >
                          <line x1="8" y1="4" x2="8" y2="12" />
                          <line x1="4" y1="8" x2="12" y2="8" />
                        </svg>
                      </button>
                    </div>

                    <button
                      className={styles.addButton}
                      onClick={() => handleAddToCart(product)}
                      disabled={product.comingSoon && !product.available}
                      type="button"
                    >
                      {product.comingSoon && !product.available
                        ? "Coming Soon"
                        : "Add to Cart"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart Summary Sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.cartSummary}>
              <h2 className={styles.sectionTitle}>
                <svg
                  className={styles.sectionIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                Your Cart ({items.length})
              </h2>

              {items.length === 0 ? (
                <div className={styles.emptyCart}>
                  <svg
                    className={styles.emptyCartIcon}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                  <p className={styles.emptyCartText}>Your cart is empty</p>
                </div>
              ) : (
                <>
                  <div className={styles.cartItems}>
                    {items.map((item) => (
                      <CartItem key={item.id} item={item} />
                    ))}
                  </div>

                  <div className={styles.summaryTotal}>
                    <div className={styles.totalRow}>
                      <span className={styles.totalLabel}>Total</span>
                      <span className={styles.totalValue}>
                        ${total.toLocaleString("en-US")}
                      </span>
                    </div>
                  </div>

                  <button
                    className={styles.checkoutButton}
                    onClick={handleProceedToCheckout}
                    type="button"
                  >
                    Proceed to Checkout
                  </button>

                  <button
                    className={styles.clearButton}
                    onClick={clearCart}
                    type="button"
                  >
                    Clear Cart
                  </button>
                </>
              )}
            </div>
          </aside>
        </div>

        {/* Checkout Section */}
        {showCheckout && items.length > 0 && (
          <div id="checkout-section" className={styles.checkoutSection}>
            <h2 className={styles.sectionTitle}>Customer Information</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="name" className={styles.label}>
                    Full Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className={styles.input}
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.label}>
                    Email <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className={styles.input}
                    value={formData.email}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="phone" className={styles.label}>
                    Phone <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className={styles.input}
                    value={formData.phone}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="company" className={styles.label}>
                    Company / Organization
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    className={styles.input}
                    value={formData.company}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="address" className={styles.label}>
                  Address <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  className={styles.input}
                  value={formData.address}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="city" className={styles.label}>
                    City <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    className={styles.input}
                    value={formData.city}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="state" className={styles.label}>
                    State / Province <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    className={styles.input}
                    value={formData.state}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="zip" className={styles.label}>
                    ZIP / Postal Code <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="zip"
                    name="zip"
                    className={styles.input}
                    value={formData.zip}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="country" className={styles.label}>
                    Country <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    className={styles.input}
                    value={formData.country}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="notes" className={styles.label}>
                  Additional Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  className={`${styles.input} ${styles.textarea}`}
                  value={formData.notes}
                  onChange={handleFormChange}
                  placeholder="Any special requirements or questions?"
                />
              </div>

              <button type="submit" className={styles.submitButton}>
                Complete Preorder
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Footer */}
      <Footer />
    </main>
  );
}
