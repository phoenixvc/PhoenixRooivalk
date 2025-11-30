/**
 * NavbarProgressVisibility Component
 *
 * This component hides/shows the Progress navbar link based on user authentication state.
 * It uses a data attribute on the document body to control visibility via CSS.
 */

import React, { useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";

export function NavbarProgressVisibility(): React.ReactElement | null {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Set a data attribute on the body to indicate authentication state
    // This allows CSS to control visibility without direct DOM manipulation
    if (!loading && user) {
      document.body.setAttribute("data-user-authenticated", "true");
    } else {
      document.body.removeAttribute("data-user-authenticated");
    }
  }, [user, loading]);

  // CSS to hide the Progress navbar item by default
  // Only show when user is authenticated (data-user-authenticated attribute is present)
  return (
    <style>{`
      /* Hide Progress navbar item by default */
      .navbar__link--progress {
        display: none !important;
      }
      
      /* Show Progress navbar item only when user is authenticated */
      body[data-user-authenticated="true"] .navbar__link--progress {
        display: flex !important;
      }
    `}</style>
  );
}

export default NavbarProgressVisibility;
