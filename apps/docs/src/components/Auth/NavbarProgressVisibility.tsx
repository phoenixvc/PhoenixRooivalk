/**
 * NavbarProgressVisibility Component
 *
 * This component hides/shows the Progress navbar link based on user authentication state.
 * It uses CSS to toggle visibility of the navbar__link--progress element.
 */

import React, { useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";

export function NavbarProgressVisibility(): React.ReactElement | null {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Find the Progress link in the navbar and toggle its visibility
    const progressLinks = document.querySelectorAll(".navbar__link--progress");
    progressLinks.forEach((progressLink) => {
      // Find the parent navbar item (could be li or div)
      const parentItem =
        progressLink.closest(".navbar__item") || progressLink.closest("li");
      if (parentItem) {
        // Show if user is authenticated and not loading
        if (!loading && user) {
          (parentItem as HTMLElement).style.display = "";
        } else {
          (parentItem as HTMLElement).style.display = "none";
        }
      }
    });
  }, [user, loading]);

  // Also add CSS to hide by default (before JavaScript runs)
  return (
    <style>{`
      /* Hide Progress navbar item by default until auth state is determined */
      .navbar__item:has(.navbar__link--progress),
      li:has(.navbar__link--progress) {
        display: none !important;
      }
    `}</style>
  );
}

export default NavbarProgressVisibility;
