"use client";

import React, { useEffect } from "react";
import { useCart } from "../../contexts/CartContext";
import { CartItem } from "./CartItem";
import styles from "./CartPanel.module.css";

interface CartPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartPanel({
  isOpen,
  onClose,
}: CartPanelProps): React.ReactElement {
  const { items, total, itemCount } = useCart();

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleCheckout = () => {
    // Navigate to preorder page
    window.location.href = "/preorder";
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`${styles.overlay} ${isOpen ? styles.open : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Cart Panel */}
      <aside
        className={`${styles.cartPanel} ${isOpen ? styles.open : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            Shopping Cart {itemCount > 0 && `(${itemCount})`}
          </h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close cart"
            type="button"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="5" y1="5" x2="15" y2="15" />
              <line x1="15" y1="5" x2="5" y2="15" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {items.length === 0 ? (
            <div className={styles.empty}>
              <svg
                className={styles.emptyIcon}
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
              <h3 className={styles.emptyTitle}>Your cart is empty</h3>
              <p className={styles.emptyText}>
                Add some products to get started with your preorder.
              </p>
              <button
                className={styles.continueButton}
                onClick={onClose}
                type="button"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className={styles.items}>
              {items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Footer with Summary */}
        {items.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.summary}>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Subtotal</span>
                <span className={styles.summaryValue}>
                  ${total.toLocaleString("en-US")}
                </span>
              </div>
              <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                <span className={styles.totalLabel}>Total</span>
                <span className={styles.totalValue}>
                  ${total.toLocaleString("en-US")}
                </span>
              </div>
            </div>

            <button
              className={styles.checkoutButton}
              onClick={handleCheckout}
              type="button"
            >
              Proceed to Checkout
            </button>

            <button
              className={styles.continueButton}
              onClick={onClose}
              type="button"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
