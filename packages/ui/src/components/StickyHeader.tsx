"use client";

import { useEffect, useState, FC } from "react";
import { createPortal } from "react-dom";

interface StickyHeaderProps {
  isVisible: boolean;
}

export const StickyHeader: FC<StickyHeaderProps> = ({ isVisible }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`fixed top-0 left-0 right-0 z-50 bg-[rgba(10,14,26,0.98)] backdrop-blur-md border-b border-[rgba(0,255,136,0.2)] shadow-lg transform transition-all duration-300 ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
      role="banner"
      aria-hidden={!isVisible}
    >
      <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
        <div className="text-sm text-[var(--gray,#9ca3af)]">
          <span className="text-[var(--primary,#f97316)] font-bold text-base">
            Phoenix Rooivalk
          </span>{" "}
          <span className="hidden sm:inline">- Counter-UAS Defense System</span>
        </div>
        <a
          href="#contact"
          className="bg-gradient-to-br from-[var(--primary,#f97316)] to-[var(--secondary,#ea7c1c)] text-[var(--dark,#020617)] px-5 py-2.5 rounded-md font-bold text-sm hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(249,115,22,0.4)] transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pr-brand-orange,#f97316)]"
          tabIndex={isVisible ? 0 : -1}
        >
          Schedule Demo
        </a>
      </div>
    </div>,
    document.body,
  );
};
