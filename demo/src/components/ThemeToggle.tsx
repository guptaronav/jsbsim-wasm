import { useTheme } from "../hooks/useTheme";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const themeLabel = {
    light: "☀️ Light",
    dark: "🌙 Dark",
    system: "🖥️ System",
  };

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      title={`Current: ${theme} mode. Click to cycle themes.`}
      aria-label="Toggle theme"
    >
      {themeLabel[theme]}
    </button>
  );
}
