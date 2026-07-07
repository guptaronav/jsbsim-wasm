import { type XmlElement, isElement, makeElement, withMatchingChild } from "./xmlTree";

/** One step in a path from a section root down to a target element.
 * `match` disambiguates repeated siblings, e.g. multiple `<location>`
 * elements distinguished by their `name` attribute. */
export interface XmlPathSegment {
  tag: string;
  match?: Record<string, string>;
}

function matchesSeg(el: XmlElement, seg: XmlPathSegment): boolean {
  if (el.tag !== seg.tag) return false;
  if (!seg.match) return true;
  return Object.entries(seg.match).every(([k, v]) => el.attrs[k] === v);
}

/** Resolve a path to the target element, or undefined if any step is missing. */
export function resolvePath(root: XmlElement | undefined, path: XmlPathSegment[]): XmlElement | undefined {
  let current = root;
  for (const seg of path) {
    if (!current) return undefined;
    current = current.children.filter(isElement).find((c) => matchesSeg(c, seg));
  }
  return current;
}

/** Immutably apply `updater` to the element at `path` under `root`, creating
 * any missing intermediate elements (with `match` attrs applied) along the
 * way. This is the single write primitive every schema field update goes
 * through. */
export function setAtPath(
  root: XmlElement,
  path: XmlPathSegment[],
  updater: (leaf: XmlElement) => XmlElement
): XmlElement {
  if (path.length === 0) return updater(root);

  const [seg, ...rest] = path;
  const existing = root.children.filter(isElement).find((c) => matchesSeg(c, seg));
  const base = existing ?? makeElement(seg.tag, seg.match ?? {});

  const updatedChild = setAtPath(base, rest, updater);
  return withMatchingChild(root, (c) => matchesSeg(c, seg), updatedChild);
}

/** Immutably ensure every element along `path` exists under `root`,
 * creating missing elements (with `match` attrs applied) as needed.
 * Returns the new root and the resolved (possibly newly created) leaf. */
export function ensurePath(root: XmlElement, path: XmlPathSegment[]): { root: XmlElement; leaf: XmlElement } {
  const newRoot = setAtPath(root, path, (leaf) => leaf);
  return { root: newRoot, leaf: resolvePath(newRoot, path)! };
}
