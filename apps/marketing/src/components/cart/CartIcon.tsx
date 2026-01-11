"use client";

import React, { useEffect, useState } from "react";
import { useCart } from "../../contexts/CartContext";
import styles from "./CartIcon.module.css";

interface CartIconProps {
  onClick?: () => void;
}

export function CartIcon({ onClick }: CartIconProps): React.ReactElement {
  const { itemCount } = useCart();
  const [animate, setAnimate] = useState(false);
  const [prevCount, setPrevCount] = useState(0);

  // Trigger animation when item count changes
  useEffect(() => {
    if (itemCount > prevCount) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 300);
      return () => clearTimeout(timer);
    }
    setPrevCount(itemCount);
  }, [itemCount, prevCount]);

  return (
    <button
      className={styles.cartIcon}
      onClick={onClick}
      aria-label={`Shopping cart with ${itemCount} item${itemCount !== 1 ? "s" : ""}`}
      type="button"
    >
      <div className={styles.iconWrapper}>
        {/* Shopping cart SVG icon */}
        <svg
          width="24"
          height="24"
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
        {itemCount > 0 && (
          <span className={`${styles.badge} ${animate ? styles.animate : ""}`}>
            {itemCount}
          </span>
        )}
      </div>
    </button>
  );
}
