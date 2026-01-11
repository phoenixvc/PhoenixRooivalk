"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { useTheme } from "../contexts/ThemeContext";
import { CartIcon } from "./cart/CartIcon";
import { CartPanel } from "./cart/CartPanel";
import styles from "./Navigation.module.css";

// Type definitions for discriminated union
type LinkItem = {
  type: "link";
  href: string;
  label: string;
};

type DropdownItem = {
  type: "dropdown";
  label: string;
  items: Array<{
    href: string;
    label: string;
    description: string;
  }>;
};

type NavigationItem = LinkItem | DropdownItem;

export const Navigation: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isCartOpen, setIsCartOpen] = React.useState(false);

  // Helper to check if a path is active
  const isPathActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  // Helper to check if any dropdown item is active
  const isDropdownActive = (items: Array<{ href: string }>) => {
    return items.some((item) => isPathActive(item.href));
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const navigationItems: NavigationItem[] = [
    {
      type: "dropdown",
      label: "Products",
      items: [
        {
          href: "/products",
          label: "All Products",
          description: "Browse our product catalog",
        },
        {
          href: "/products#skysnare",
          label: "SkySnare™",
          description: "Consumer drone capture",
        },
        {
          href: "/products#netsnare",
          label: "NetSnare™",
          description: "Ground launchers",
        },
        {
          href: "/products#aeronet",
          label: "AeroNet™",
          description: "Enterprise platform",
        },
        {
          href: "/contact",
          label: "Preorder",
          description: "Reserve yours - no deposit",
        },
      ],
    },
    {
      type: "dropdown",
      label: "Technology",
      items: [
        {
          href: "/technical",
          label: "Technical Specs",
          description: "Detailed specifications",
        },
        {
          href: "/capabilities",
          label: "Capabilities",
          description: "Core system features",
        },
        {
          href: "/methods",
          label: "Defense Methods",
          description: "Counter-drone strategies",
        },
        {
          href: "/timeline",
          label: "Development Timeline",
          description: "Project roadmap",
        },
      ],
    },
    {
      type: "dropdown",
      label: "Business",
      items: [
        {
          href: "/roi-calculator",
          label: "ROI Calculator",
          description: "Calculate your savings",
        },
        {
          href: "/schedule",
          label: "Schedule Meeting",
          description: "Book a demo or consultation",
        },
        {
          href: "/partnerships",
          label: "Partnerships",
          description: "Collaboration opportunities",
        },
        {
          href: "/sbir",
          label: "SBIR Program",
          description: "Government funding",
        },
      ],
    },
    {
      type: "link",
      href: "/about",
      label: "About",
    },
    {
      type: "link",
      href: "/contact",
      label: "Contact",
    },
  ];

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <div className={styles.logoWrapper}>
            <Image
              src="/logo.svg"
              alt="Phoenix Rooivalk Logo"
              width={56}
              height={56}
              className={styles.logoImage}
            />
            <div className={styles.logoGlow}></div>
            <div className={styles.logoGlowOuter}></div>
          </div>
          <div className={styles.logoText}>Phoenix Rooivalk</div>
        </Link>

        {/* Enhanced Navigation with Dropdowns */}
        <div className={styles.navMenu}>
          <div className={styles.navMenuInner}>
            <ul className={styles.navList}>
              {navigationItems.map((item) => (
                <li
                  key={item.type === "link" ? item.href : item.label}
                  className={styles.navItem}
                >
                  {item.type === "dropdown" ? (
                    <>
                      <button
                        className={`${styles.navButton} ${isDropdownActive(item.items) ? styles.navButtonActive : ""}`}
                      >
                        {item.label}
                        <svg
                          className={styles.chevron}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                      {/* Dropdown Menu */}
                      <div className={styles.dropdown}>
                        <div className={styles.dropdownInner}>
                          {item.items?.map((subItem) => (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              className={styles.dropdownLink}
                            >
                              <span className={styles.dropdownLabel}>
                                {subItem.label}
                              </span>
                              <span className={styles.dropdownDescription}>
                                {subItem.description}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : item.type === "link" ? (
                    <Link
                      href={item.href}
                      className={`${styles.navLink} ${isPathActive(item.href) ? styles.navLinkActive : ""}`}
                    >
                      {item.label}
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Cart Icon */}
        <div className={styles.cartWrapper}>
          <CartIcon onClick={() => setIsCartOpen(true)} />
        </div>

        {/* Mobile navigation */}
        <div className={styles.mobileNav}>
          <button
            className={styles.mobileMenuButton}
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
          >
            <svg
              className={styles.mobileMenuIcon}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu overlay */}
        {isMobileMenuOpen && (
          <div className={styles.mobileMenuOverlay}>
            <div className={styles.mobileMenuContent}>
              <nav className={styles.mobileMenuNav}>
                {navigationItems.map((item) => (
                  <div
                    key={item.type === "link" ? item.href : item.label}
                    className={styles.mobileMenuItem}
                  >
                    {item.type === "dropdown" ? (
                      <>
                        <div className={styles.mobileMenuLabel}>
                          {item.label}
                        </div>
                        <div className={styles.mobileMenuSubItems}>
                          {item.items?.map((subItem) => (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              className={styles.mobileMenuLink}
                              onClick={closeMobileMenu}
                            >
                              <span className={styles.mobileMenuLinkLabel}>
                                {subItem.label}
                              </span>
                              <span
                                className={styles.mobileMenuLinkDescription}
                              >
                                {subItem.description}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </>
                    ) : item.type === "link" ? (
                      <Link
                        href={item.href}
                        className={styles.mobileMenuLink}
                        onClick={closeMobileMenu}
                      >
                        <span className={styles.mobileMenuLinkLabel}>
                          {item.label}
                        </span>
                      </Link>
                    ) : null}
                  </div>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Theme Toggle & Links */}
        <div className={styles.actions}>
          {/* GitHub Dropdown */}
          <div className={styles.githubDropdown}>
            <div className={styles.githubDropdownWrapper}>
              <button className={styles.githubButton}>
                <svg
                  className={styles.githubIcon}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                <span className={styles.githubText}>GitHub</span>
                <svg
                  className={styles.githubChevron}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              <div className={styles.githubDropdownMenu}>
                <div className={styles.githubDropdownInner}>
                  <a
                    href="https://github.com/JustAGhosT/PhoenixRooivalk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.githubDropdownLink}
                  >
                    <svg
                      className={styles.githubDropdownIcon}
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    <div className={styles.githubDropdownContent}>
                      <div className={styles.githubDropdownTitle}>
                        Phoenix Rooivalk
                      </div>
                      <div className={styles.githubDropdownDesc}>
                        Main repository
                      </div>
                    </div>
                  </a>
                  <a
                    href="https://github.com/justaghost/cognitive-mesh"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.githubDropdownLink}
                  >
                    <svg
                      className={styles.githubDropdownIcon}
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    <div className={styles.githubDropdownContent}>
                      <div className={styles.githubDropdownTitle}>
                        Cognitive Mesh
                      </div>
                      <div className={styles.githubDropdownDesc}>
                        AI integration
                      </div>
                    </div>
                  </a>
                  <div className={styles.divider}></div>
                  <a
                    href={process.env.NEXT_PUBLIC_DOCS_URL || "/docs"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.githubDropdownLink}
                  >
                    <svg
                      className={styles.githubDropdownIcon}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <div className={styles.githubDropdownContent}>
                      <div className={styles.githubDropdownTitle}>
                        Documentation
                      </div>
                      <div className={styles.githubDropdownDesc}>
                        Technical docs
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={styles.themeToggle}
            aria-label={`Switch to ${
              theme === "phoenix"
                ? "blue"
                : theme === "blue"
                  ? "green"
                  : "phoenix"
            } theme`}
          >
            <div className={styles.themeIcon}>
              {theme === "phoenix" ? (
                <div className={styles.themeIconPhoenix}></div>
              ) : theme === "blue" ? (
                <div className={styles.themeIconBlue}></div>
              ) : (
                <div className={styles.themeIconGreen}></div>
              )}
            </div>
          </button>

          {/* Login and CTA Buttons */}
          <Link href="/login" className={styles.loginButton}>
            Login
          </Link>
          <Link href="/contact" className={styles.ctaButton}>
            Get Started
          </Link>
        </div>
      </div>

      {/* Cart Panel */}
      <CartPanel isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </nav>
  );
};
