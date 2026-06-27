type RehypeNode = {
  tagName?: string;
  properties?: {
    href?: unknown;
    [key: string]: unknown;
  };
  children?: RehypeNode[];
};

export function createRehypeBaseLinks(base: string) {
  return function rehypeBaseLinks() {
    const walk = (node: RehypeNode) => {
      if (node && node.tagName === 'a' && node.properties) {
        const h = node.properties.href;
        if (typeof h === 'string' && h.startsWith('/') && !h.startsWith(base + '/') && h !== base) {
          node.properties.href = base + h;
        }
      }
      if (node && node.children) node.children.forEach(walk);
    };
    return (tree: unknown) => walk(tree as RehypeNode);
  };
}
