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

    // Theme color definitions: legacy RGB triplets + shared --pr-* design tokens
    const themes = {
      phoenix: {
        primary: "249, 115, 22",
        accent: "251, 146, 60",
        accentBase: "#f97316",
        accentHover: "#fb923c",
        accentActive: "#ea580c",
        accentSubtle: "rgba(249, 115, 22, 0.15)",
      },
      blue: {
        primary: "59, 130, 246",
        accent: "96, 165, 250",
        accentBase: "#3b82f6",
        accentHover: "#60a5fa",
        accentActive: "#1e40af",
        accentSubtle: "rgba(59, 130, 246, 0.15)",
      },
      green: {
        primary: "34, 197, 94",
        accent: "74, 222, 128",
        accentBase: "#22c55e",
        accentHover: "#4ade80",
        accentActive: "#15803d",
        accentSubtle: "rgba(34, 197, 94, 0.15)",
      },
    };

    const t = themes[theme];

    // Legacy RGB-triplet vars (consumed via `rgb(var(--primary))`)
    root.style.setProperty("--primary", t.primary);
    root.style.setProperty("--secondary", "51, 65, 85");
    root.style.setProperty("--accent", t.accent);
    root.style.setProperty("--orange", t.primary);
    root.style.setProperty("--action-primary", t.primary);
    root.style.setProperty("--brand-primary", t.primary);
    root.style.setProperty("--brand-accent", t.accent);
    root.style.setProperty("--red-glow", `rgba(${t.primary}, 0.2)`);
    root.style.setProperty("--orange-glow", `rgba(${t.primary}, 0.15)`);
    root.style.setProperty("--amber-glow", `rgba(${t.accent}, 0.15)`);

    // Shared --pr-* design tokens (from packages/ui/src/tokens/)
    root.style.setProperty("--pr-accent-base", t.accentBase);
    root.style.setProperty("--pr-accent-hover", t.accentHover);
    root.style.setProperty("--pr-accent-active", t.accentActive);
    root.style.setProperty("--pr-accent-subtle", t.accentSubtle);
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
