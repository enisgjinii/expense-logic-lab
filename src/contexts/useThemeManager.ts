
import { useState, useEffect } from 'react';
import { saveThemeMode, getThemeMode } from './localStorageService';

export const useThemeManager = () => {
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

  const setThemeMode = (mode: "light" | "dark" | "system") => {
    setThemeModeState(mode);
  };

  return { themeMode, setThemeMode };
};
