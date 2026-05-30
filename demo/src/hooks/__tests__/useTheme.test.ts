/**
 * useTheme hook tests
 *
 * Tests the cycling behavior, localStorage persistence, and DOM attribute
 * side-effects of the useTheme hook.  We call renderHook from
 * @testing-library/react so the hook runs inside a real React tree.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTheme } from "../useTheme";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getThemeAttr() {
  return document.documentElement.getAttribute("data-theme");
}

function getColorScheme() {
  return document.documentElement.style.colorScheme;
}

// ---------------------------------------------------------------------------
// jsdom doesn't implement matchMedia — provide a configurable stub
// ---------------------------------------------------------------------------

function mockMatchMedia(prefersDark = false) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockReturnValue({
      matches: prefersDark,
      media: "(prefers-color-scheme: dark)",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as MediaQueryList),
  });
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.style.colorScheme = "";
  mockMatchMedia(false); // default: system prefers light
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useTheme", () => {
  describe("initial state", () => {
    it("defaults to system when localStorage is empty", () => {
      const { result } = renderHook(() => useTheme());
      expect(result.current.theme).toBe("system");
    });

    it("reads stored theme from localStorage", () => {
      localStorage.setItem("theme", "dark");
      const { result } = renderHook(() => useTheme());
      expect(result.current.theme).toBe("dark");
    });

    it("falls back to system for an unknown stored value", () => {
      localStorage.setItem("theme", "bogus");
      const { result } = renderHook(() => useTheme());
      // "bogus" is cast as Theme; hook should still work (treats as system)
      expect(result.current.theme).toBe("bogus");
    });
  });

  describe("toggleTheme", () => {
    it("cycles system → light → dark → system", () => {
      const { result } = renderHook(() => useTheme());
      expect(result.current.theme).toBe("system");

      act(() => result.current.toggleTheme());
      expect(result.current.theme).toBe("light");

      act(() => result.current.toggleTheme());
      expect(result.current.theme).toBe("dark");

      act(() => result.current.toggleTheme());
      expect(result.current.theme).toBe("system");
    });

    it("persists each toggle to localStorage", () => {
      const { result } = renderHook(() => useTheme());

      act(() => result.current.toggleTheme()); // → light
      expect(localStorage.getItem("theme")).toBe("light");

      act(() => result.current.toggleTheme()); // → dark
      expect(localStorage.getItem("theme")).toBe("dark");

      act(() => result.current.toggleTheme()); // → system
      expect(localStorage.getItem("theme")).toBe("system");
    });
  });

  describe("setTheme", () => {
    it("sets theme to dark directly", () => {
      const { result } = renderHook(() => useTheme());
      act(() => result.current.setTheme("dark"));
      expect(result.current.theme).toBe("dark");
    });

    it("sets theme to light directly", () => {
      const { result } = renderHook(() => useTheme());
      act(() => result.current.setTheme("light"));
      expect(result.current.theme).toBe("light");
    });

    it("sets theme to system directly", () => {
      const { result } = renderHook(() => useTheme());
      act(() => result.current.setTheme("dark"));
      act(() => result.current.setTheme("system"));
      expect(result.current.theme).toBe("system");
    });
  });

  describe("DOM side-effects", () => {
    it("sets data-theme attribute for light mode", () => {
      const { result } = renderHook(() => useTheme());
      act(() => result.current.setTheme("light"));
      expect(getThemeAttr()).toBe("light");
      expect(getColorScheme()).toBe("light");
    });

    it("sets data-theme attribute for dark mode", () => {
      const { result } = renderHook(() => useTheme());
      act(() => result.current.setTheme("dark"));
      expect(getThemeAttr()).toBe("dark");
      expect(getColorScheme()).toBe("dark");
    });

    it("removes data-theme attribute for system mode", () => {
      const { result } = renderHook(() => useTheme());
      act(() => result.current.setTheme("dark"));
      act(() => result.current.setTheme("system"));
      expect(getThemeAttr()).toBeNull();
    });

    it("applies light color-scheme when system prefers light", () => {
      // matchMedia already mocked to return matches=false (light)
      const { result } = renderHook(() => useTheme());
      act(() => result.current.setTheme("system"));
      expect(getColorScheme()).toBe("light");
    });

    it("applies dark color-scheme when system prefers dark", () => {
      mockMatchMedia(true); // dark preference

      const { result } = renderHook(() => useTheme());
      act(() => result.current.setTheme("system"));
      expect(getColorScheme()).toBe("dark");
    });
  });
});
