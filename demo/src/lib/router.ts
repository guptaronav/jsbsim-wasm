/**
 * Minimal hash-based router. Avoids a router dependency and works on GitHub
 * Pages without server-side rewrites (deep links to #/designer resolve
 * client-side against the single index.html).
 */
import { useSyncExternalStore } from "react";

export type RouteName = "mission-control" | "designer";

const DEFAULT_ROUTE: RouteName = "mission-control";

function parseHash(hash: string): RouteName {
  const path = hash.replace(/^#\/?/, "");
  return path.startsWith("designer") ? "designer" : DEFAULT_ROUTE;
}

function subscribe(callback: () => void): () => void {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

function getSnapshot(): RouteName {
  return parseHash(window.location.hash);
}

export function navigate(route: RouteName): void {
  window.location.hash = `/${route}`;
}

export function useRoute(): RouteName {
  return useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_ROUTE);
}
