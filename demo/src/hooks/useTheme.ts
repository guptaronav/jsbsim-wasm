import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system";
    const stored = localStorage.getItem("theme");
    return (stored as Theme) || "system";
  });

  useEffect(() => {
    const root = document.documentElement;

    if (theme === "system") {
      root.removeAttribute("data-theme");
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.style.colorScheme = isDark ? "dark" : "light";
    } else {
      root.setAttribute("data-theme", theme);
      root.style.colorScheme = theme;
    }

    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      if (prev === "system") return "light";
      if (prev === "light") return "dark";
      return "system";
    });
  };

  return { theme, setTheme, toggleTheme };
}
