"use client";

import React from "react";
import type { CartItem as CartItemType } from "../../types/cart";
import { useCart } from "../../contexts/CartContext";
import styles from "./CartItem.module.css";

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps): React.ReactElement {
  const { updateQuantity, removeItem } = useCart();

  const handleIncrement = () => {
    updateQuantity(item.id, item.quantity + 1);
  };

  const handleDecrement = () => {
    updateQuantity(item.id, item.quantity - 1);
  };

  const handleRemove = () => {
    removeItem(item.id);
  };

  const itemTotal = item.price * item.quantity;

  return (
    <div className={styles.cartItem}>
      <div className={styles.itemImage} aria-hidden="true">
        {item.image ? <img src={item.image} alt="" /> : <span>No Image</span>}
      </div>

      <div className={styles.itemDetails}>
        <h3 className={styles.itemName}>{item.name}</h3>
        <p className={styles.itemPhase}>{item.phaseTimeline}</p>
        <div>
          <div className={styles.itemPrice}>
            ${itemTotal.toLocaleString("en-US")}
          </div>
          {item.monthlyFee && (
            <div className={styles.monthlyFee}>
              + ${item.monthlyFee}/mo subscription
            </div>
          )}
        </div>
      </div>

      <div className={styles.itemActions}>
        <div
          className={styles.quantitySelector}
          role="group"
          aria-label="Quantity"
        >
          <button
            className={styles.quantityButton}
            onClick={handleDecrement}
            aria-label="Decrease quantity"
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
              <line x1="4" y1="8" x2="12" y2="8" />
            </svg>
          </button>
          <span className={styles.quantityValue} aria-live="polite">
            {item.quantity}
          </span>
          <button
            className={styles.quantityButton}
            onClick={handleIncrement}
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
          className={styles.removeButton}
          onClick={handleRemove}
          aria-label={`Remove ${item.name} from cart`}
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
            <line x1="4" y1="4" x2="12" y2="12" />
            <line x1="12" y1="4" x2="4" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
