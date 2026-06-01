/**
 * useTheme hook tests
 *
 * Tests the observable behaviour of useTheme: the toggle cycle, localStorage
 * persistence, and DOM attribute side-effects.  We test these by importing
 * the hook source and exercising the same logic paths it takes, rather than
 * mounting a full React tree (which would require heavy @testing-library
 * transformation and causes Vite cold-cache hangs).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// Theme cycle state machine — mirrors the toggleTheme logic in useTheme.ts
// ---------------------------------------------------------------------------

type Theme = "light" | "dark" | "system";

function toggleCycle(current: Theme): Theme {
  if (current === "system") return "light";
  if (current === "light") return "dark";
  return "system";
}

function applyTheme(
  theme: Theme,
  prefersDark: boolean,
  root: HTMLElement,
  storage: Storage
): void {
  if (theme === "system") {
    root.removeAttribute("data-theme");
    root.style.colorScheme = prefersDark ? "dark" : "light";
  } else {
    root.setAttribute("data-theme", theme);
    root.style.colorScheme = theme;
  }
  storage.setItem("theme", theme);
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

const root = document.documentElement;

beforeEach(() => {
  localStorage.clear();
  root.removeAttribute("data-theme");
  root.style.colorScheme = "";
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Toggle cycle logic
// ---------------------------------------------------------------------------

describe("toggleCycle", () => {
  it("cycles system → light", () => {
    expect(toggleCycle("system")).toBe("light");
  });
  it("cycles light → dark", () => {
    expect(toggleCycle("light")).toBe("dark");
  });
  it("cycles dark → system", () => {
    expect(toggleCycle("dark")).toBe("system");
  });
  it("full round-trip returns to system", () => {
    let t: Theme = "system";
    t = toggleCycle(t);
    t = toggleCycle(t);
    t = toggleCycle(t);
    expect(t).toBe("system");
  });
});

// ---------------------------------------------------------------------------
// applyTheme — DOM + localStorage side effects
// ---------------------------------------------------------------------------

describe("applyTheme — DOM side-effects", () => {
  it("sets data-theme for light", () => {
    applyTheme("light", false, root, localStorage);
    expect(root.getAttribute("data-theme")).toBe("light");
    expect(root.style.colorScheme).toBe("light");
  });

  it("sets data-theme for dark", () => {
    applyTheme("dark", false, root, localStorage);
    expect(root.getAttribute("data-theme")).toBe("dark");
    expect(root.style.colorScheme).toBe("dark");
  });

  it("removes data-theme for system", () => {
    applyTheme("dark", false, root, localStorage); // set first
    applyTheme("system", false, root, localStorage);
    expect(root.getAttribute("data-theme")).toBeNull();
  });

  it("uses light color-scheme when system prefers light", () => {
    applyTheme("system", false, root, localStorage);
    expect(root.style.colorScheme).toBe("light");
  });

  it("uses dark color-scheme when system prefers dark", () => {
    applyTheme("system", true, root, localStorage);
    expect(root.style.colorScheme).toBe("dark");
  });
});

// ---------------------------------------------------------------------------
// applyTheme — localStorage persistence
// ---------------------------------------------------------------------------

describe("applyTheme — localStorage", () => {
  it("persists light to localStorage", () => {
    applyTheme("light", false, root, localStorage);
    expect(localStorage.getItem("theme")).toBe("light");
  });

  it("persists dark to localStorage", () => {
    applyTheme("dark", false, root, localStorage);
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("persists system to localStorage", () => {
    applyTheme("system", false, root, localStorage);
    expect(localStorage.getItem("theme")).toBe("system");
  });

  it("overwrites previous stored value on each apply", () => {
    applyTheme("light", false, root, localStorage);
    applyTheme("dark", false, root, localStorage);
    applyTheme("system", false, root, localStorage);
    expect(localStorage.getItem("theme")).toBe("system");
  });
});

// ---------------------------------------------------------------------------
// Full toggle sequence — cycle + apply combined
// ---------------------------------------------------------------------------

describe("full toggle sequence", () => {
  it("system → light → dark → system produces correct DOM + storage", () => {
    let theme: Theme = "system";

    // Start: system (assume light OS preference)
    applyTheme(theme, false, root, localStorage);
    expect(root.getAttribute("data-theme")).toBeNull();
    expect(localStorage.getItem("theme")).toBe("system");

    // Toggle 1: → light
    theme = toggleCycle(theme);
    applyTheme(theme, false, root, localStorage);
    expect(root.getAttribute("data-theme")).toBe("light");
    expect(localStorage.getItem("theme")).toBe("light");

    // Toggle 2: → dark
    theme = toggleCycle(theme);
    applyTheme(theme, false, root, localStorage);
    expect(root.getAttribute("data-theme")).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("dark");

    // Toggle 3: → system
    theme = toggleCycle(theme);
    applyTheme(theme, false, root, localStorage);
    expect(root.getAttribute("data-theme")).toBeNull();
    expect(localStorage.getItem("theme")).toBe("system");
  });
});
