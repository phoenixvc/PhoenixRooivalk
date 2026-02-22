"use client";

import { ReactNode, useEffect, useState } from "react";

import { useIntersectionObserver } from "../hooks/useIntersectionObserver";

interface RevealSectionProps {
  children: ReactNode;
  className?: string;
  threshold?: number;
  triggerOnce?: boolean;
}

export function RevealSection({
  children,
  className = "",
  threshold = 0.1,
  triggerOnce = true,
}: RevealSectionProps) {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold,
    triggerOnce,
  });

  // Respect prefers-reduced-motion: skip animation entirely so content is
  // never hidden behind opacity-0 for users who disable motion.
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const shouldAnimate = !prefersReducedMotion;
  const visible = !shouldAnimate || isIntersecting;

  return (
    <div
      ref={ref}
      className={`${shouldAnimate ? "transition-all duration-700" : ""} ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </div>
  );
}
