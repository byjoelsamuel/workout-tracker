// Theme state lives on <html data-theme> (set by public/theme-init.js
// before first paint) and everything else keys off CSS custom properties.
// So nothing needs this except the toggle button itself — no context, no
// prop drilling.
import { useCallback, useState } from "react";
import { STORAGE_KEYS } from "../lib/storageKeys.js";

export function useTheme() {
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute("data-theme") || "light"
  );

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem(STORAGE_KEYS.theme, next);
      return next;
    });
  }, []);

  return { theme, toggle };
}
