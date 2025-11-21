"use client";
import * as React from "react";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "phoenix" | "blue" | "green";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("phoenix-theme") as Theme | null;
      if (
        savedTheme &&
        (savedTheme === "phoenix" ||
          savedTheme === "blue" ||
          savedTheme === "green")
      ) {
        return savedTheme;
      }
    }
    return "phoenix";
  });
  const [mounted, setMounted] = useState(false);

  // Mark as mounted
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Standard Next.js hydration pattern
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Save theme to localStorage
    localStorage.setItem("phoenix-theme", theme);

    // Apply theme to CSS custom properties
    const root = document.documentElement;

    if (theme === "phoenix") {
      // Phoenix Rooivalk Fire Theme (Default - Orange/Red)
      root.style.setProperty("--primary", "249, 115, 22"); // Phoenix Orange
      root.style.setProperty("--secondary", "51, 65, 85"); // Tactical Gray Dark
      root.style.setProperty("--accent", "251, 146, 60"); // Phoenix Amber
      root.style.setProperty("--orange", "249, 115, 22"); // Phoenix Orange
      root.style.setProperty("--action-primary", "249, 115, 22"); // Phoenix Orange
      root.style.setProperty("--brand-primary", "249, 115, 22");
      root.style.setProperty("--brand-accent", "251, 146, 60");
      root.style.setProperty("--red-glow", "rgba(249, 115, 22, 0.2)");
      root.style.setProperty("--orange-glow", "rgba(249, 115, 22, 0.15)");
      root.style.setProperty("--amber-glow", "rgba(251, 146, 60, 0.15)");
    } else if (theme === "blue") {
      // Blue Tactical Theme
      root.style.setProperty("--primary", "59, 130, 246"); // Blue 500
      root.style.setProperty("--secondary", "51, 65, 85"); // Tactical Gray Dark
      root.style.setProperty("--accent", "96, 165, 250"); // Blue 400
      root.style.setProperty("--orange", "59, 130, 246"); // Use blue instead of orange
      root.style.setProperty("--action-primary", "59, 130, 246"); // Blue
      root.style.setProperty("--brand-primary", "59, 130, 246");
      root.style.setProperty("--brand-accent", "96, 165, 250");
      root.style.setProperty("--red-glow", "rgba(59, 130, 246, 0.2)");
      root.style.setProperty("--orange-glow", "rgba(59, 130, 246, 0.15)");
      root.style.setProperty("--amber-glow", "rgba(96, 165, 250, 0.15)");
    } else {
      // Green Tactical Theme
      root.style.setProperty("--primary", "34, 197, 94"); // Green 500
      root.style.setProperty("--secondary", "51, 65, 85"); // Tactical Gray Dark
      root.style.setProperty("--accent", "74, 222, 128"); // Green 400
      root.style.setProperty("--orange", "34, 197, 94"); // Use green instead of orange
      root.style.setProperty("--action-primary", "34, 197, 94"); // Green
      root.style.setProperty("--brand-primary", "34, 197, 94");
      root.style.setProperty("--brand-accent", "74, 222, 128");
      root.style.setProperty("--red-glow", "rgba(34, 197, 94, 0.2)");
      root.style.setProperty("--orange-glow", "rgba(34, 197, 94, 0.15)");
      root.style.setProperty("--amber-glow", "rgba(74, 222, 128, 0.15)");
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme((prev) => {
      if (prev === "phoenix") return "blue";
      if (prev === "blue") return "green";
      return "phoenix";
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
