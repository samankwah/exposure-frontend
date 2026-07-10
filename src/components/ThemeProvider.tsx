"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

export type ThemeMode = "day" | "night";

export const THEME_STORAGE_KEY = "clene-theme";
const THEME_MEDIA_QUERY = "(prefers-color-scheme: dark)";

type ThemeContextValue = {
  resolvedTheme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  theme: ThemeMode;
  toggleTheme: () => void;
};

type ReadableThemeStorage = Pick<Storage, "getItem">;
type WritableThemeStorage = Pick<Storage, "setItem">;
type ThemeMatchMedia = (query: string) => Pick<MediaQueryList, "matches">;

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === "day" || value === "night";
}

export function readStoredTheme(storage: ReadableThemeStorage | undefined): ThemeMode | null {
  try {
    const value = storage?.getItem(THEME_STORAGE_KEY);
    return isThemeMode(value) ? value : null;
  } catch {
    return null;
  }
}

export function writeStoredTheme(storage: WritableThemeStorage | undefined, theme: ThemeMode) {
  try {
    storage?.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be disabled in strict privacy contexts. The in-memory theme still works.
  }
}

export function getSystemTheme(matchMedia: ThemeMatchMedia | undefined): ThemeMode {
  try {
    return matchMedia?.(THEME_MEDIA_QUERY).matches ? "night" : "day";
  } catch {
    return "day";
  }
}

export function resolveInitialTheme({
  matchMedia,
  storage
}: {
  matchMedia?: ThemeMatchMedia;
  storage?: ReadableThemeStorage;
} = {}): ThemeMode {
  return readStoredTheme(storage) ?? getSystemTheme(matchMedia);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => getBootstrappedTheme());
  const [hasUserChoice, setHasUserChoice] = useState(false);

  useEffect(() => {
    const storedTheme = readStoredTheme(getBrowserStorage());
    const initialTheme = storedTheme ?? getSystemTheme(window.matchMedia.bind(window));

    setHasUserChoice(Boolean(storedTheme));
    setThemeState(initialTheme);
    applyDocumentTheme(initialTheme);
  }, []);

  useEffect(() => {
    if (hasUserChoice || typeof window === "undefined") return;

    const query = window.matchMedia(THEME_MEDIA_QUERY);
    const updateFromSystem = (event: MediaQueryListEvent) => {
      const nextTheme = event.matches ? "night" : "day";
      setThemeState(nextTheme);
      applyDocumentTheme(nextTheme);
    };

    query.addEventListener("change", updateFromSystem);

    return () => {
      query.removeEventListener("change", updateFromSystem);
    };
  }, [hasUserChoice]);

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    setHasUserChoice(true);
    setThemeState(nextTheme);
    writeStoredTheme(getBrowserStorage(), nextTheme);
    applyDocumentTheme(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "night" ? "day" : "night");
  }, [setTheme, theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      resolvedTheme: theme,
      setTheme,
      theme,
      toggleTheme
    }),
    [setTheme, theme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}

function applyDocumentTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme === "night" ? "dark" : "light";
}

function getBrowserStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function getBootstrappedTheme(): ThemeMode {
  if (typeof document === "undefined") return "day";

  const theme = document.documentElement.dataset.theme;
  return isThemeMode(theme) ? theme : "day";
}
