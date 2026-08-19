"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { THEME_STORAGE_KEY } from "@/lib/constants";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readTheme(): Theme {
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
  if (stored === "light" || stored === "dark") return stored;
  return "dark";
}

function getServerSnapshot(): Theme {
  return "dark";
}

function subscribe(onStoreChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    media.removeEventListener("change", onStoreChange);
  };
}

function applyThemeClass(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const preferred = useSyncExternalStore(subscribe, readTheme, getServerSnapshot);
  const [override, setOverride] = useState<Theme | null>(null);
  const theme = override ?? preferred;

  useLayoutEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setOverride(next);
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
    applyThemeClass(next);
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  const value = useMemo(
    () => ({ theme, toggle, setTheme }),
    [theme, toggle, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
