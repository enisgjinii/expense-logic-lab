
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { saveThemeMode, getThemeMode } from './localStorageService';

type ThemeContextType = {
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [themeMode, setThemeModeState] = useState<"light" | "dark" | "system">("system");

  useEffect(() => {
    const savedTheme = getThemeMode();
    if (savedTheme) {
      setThemeModeState(savedTheme);
    }
  }, []);

  useEffect(() => {
    const getPreferredTheme = (mode: "light" | "dark" | "system") => {
      if (mode === "system") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
      return mode;
    };

    const appliedTheme = getPreferredTheme(themeMode);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(appliedTheme);
    saveThemeMode(themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (themeMode === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => {
        const appliedTheme = mediaQuery.matches ? "dark" : "light";
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(appliedTheme);
      };
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [themeMode]);

  const setTheme = (mode: "light" | "dark" | "system") => {
    setThemeModeState(mode);
  };

  return (
    <ThemeContext.Provider value={{ theme: themeMode, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
