/**
 * Minimal, generic, immutable XML tree — the substrate the whole Designer
 * is built on. Parsing/serializing the *entire* document (not just the
 * fields we have schemas for) means unmapped elements pass through
 * untouched, so round-tripping a real-world file is safe by construction.
 */

export interface XmlElement {
  tag: string;
  attrs: Record<string, string>;
  children: XmlNode[];
}

export interface XmlText {
  text: string;
}

export type XmlNode = XmlElement | XmlText;

export function isElement(node: XmlNode): node is XmlElement {
  return "tag" in node;
}

function domToElement(node: Element): XmlElement {
  const attrs: Record<string, string> = {};
  for (const attr of Array.from(node.attributes)) {
    attrs[attr.name] = attr.value;
  }
  const children: XmlNode[] = [];
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      children.push(domToElement(child as Element));
    } else if (child.nodeType === Node.TEXT_NODE || child.nodeType === Node.CDATA_SECTION_NODE) {
      const text = child.textContent ?? "";
      if (text.trim().length > 0) children.push({ text });
    }
  }
  return { tag: node.tagName, attrs, children };
}

export function parseXml(source: string): XmlElement {
  const doc = new DOMParser().parseFromString(source, "application/xml");
  const errorNode = doc.querySelector("parsererror");
  if (errorNode) {
    throw new Error(`XML parse error: ${errorNode.textContent?.trim() ?? "unknown"}`);
  }
  if (!doc.documentElement) {
    throw new Error("XML parse error: no root element");
  }
  return domToElement(doc.documentElement);
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function serializeElement(el: XmlElement, depth: number): string {
  const indent = "  ".repeat(depth);
  const attrString = Object.entries(el.attrs)
    .map(([k, v]) => ` ${k}="${escapeAttr(v)}"`)
    .join("");

  const elementChildren = el.children.filter(isElement);
  const textChildren = el.children.filter((c): c is XmlText => !isElement(c));

  if (el.children.length === 0) {
    return `${indent}<${el.tag}${attrString}/>`;
  }

  if (elementChildren.length === 0 && textChildren.length > 0) {
    const text = textChildren.map((t) => escapeText(t.text)).join("");
    return `${indent}<${el.tag}${attrString}>${text}</${el.tag}>`;
  }

  const inner = el.children
    .map((child) => (isElement(child) ? serializeElement(child, depth + 1) : `${"  ".repeat(depth + 1)}${escapeText(child.text)}`))
    .join("\n");
  return `${indent}<${el.tag}${attrString}>\n${inner}\n${indent}</${el.tag}>`;
}

export function serializeXml(root: XmlElement): string {
  return `<?xml version="1.0"?>\n${serializeElement(root, 0)}\n`;
}

/** First direct child element with the given tag, if any. */
export function findChild(el: XmlElement, tag: string): XmlElement | undefined {
  return el.children.filter(isElement).find((c) => c.tag === tag);
}

/** All direct child elements with the given tag. */
export function findChildren(el: XmlElement, tag: string): XmlElement[] {
  return el.children.filter(isElement).filter((c) => c.tag === tag);
}

/** Concatenated direct text content of an element (not descendants). */
export function textOf(el: XmlElement | undefined): string {
  if (!el) return "";
  return el.children
    .filter((c): c is XmlText => !isElement(c))
    .map((t) => t.text)
    .join("")
    .trim();
}

/** Immutably returns a copy of `el` with `child` replacing the first element
 * satisfying `predicate`, or appended if no such child exists. */
export function withMatchingChild(
  el: XmlElement,
  predicate: (c: XmlElement) => boolean,
  child: XmlElement
): XmlElement {
  let replaced = false;
  const children = el.children.map((c) => {
    if (isElement(c) && !replaced && predicate(c)) {
      replaced = true;
      return child;
    }
    return c;
  });
  if (!replaced) children.push(child);
  return { ...el, children };
}

/** Immutably returns a copy of `el` with `child` replacing the first element
 * matching `child.tag`, or appended if no such child exists. */
export function withChild(el: XmlElement, child: XmlElement): XmlElement {
  return withMatchingChild(el, (c) => c.tag === child.tag, child);
}

/** Immutably returns a copy of `el` with its direct text content replaced. */
export function withText(el: XmlElement, text: string): XmlElement {
  const nonText = el.children.filter(isElement);
  return { ...el, children: [...nonText, { text }] };
}

/** Immutably returns a copy of `el` with one attribute set. */
export function withAttr(el: XmlElement, name: string, value: string): XmlElement {
  return { ...el, attrs: { ...el.attrs, [name]: value } };
}

export function makeElement(tag: string, attrs: Record<string, string> = {}, children: XmlNode[] = []): XmlElement {
  return { tag, attrs, children };
}
