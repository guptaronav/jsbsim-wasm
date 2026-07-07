/**
 * Literal color values for the recharts canvas. Recharts renders `stroke`/
 * `fill` as raw SVG presentation attributes, which — unlike the `style`
 * attribute — do not resolve CSS custom properties, so these must mirror
 * (not reference) the --chart-* tokens in styles/tokens.css.
 */
export const CHART_SERIES_COLORS = ["#38bdf8", "#22c55e", "#f59e0b", "#a78bfa", "#f472b6"] as const;
export const CHART_GRID_COLOR = "#232a35";
export const CHART_AXIS_COLOR = "#5c6879";
export const CHART_TOOLTIP_BG = "#171c25";
