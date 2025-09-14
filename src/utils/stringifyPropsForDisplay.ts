export function stringifyPropsForDisplay(
  value: any,
  options?: { maxDepth?: number; maxKeys?: number; maxString?: number },
): string {
  const maxDepth = options?.maxDepth ?? 2;
  const maxKeys = options?.maxKeys ?? 20;
  const maxString = options?.maxString ?? 2000;
  const seen = new WeakSet<object>();

  function truncateString(input: string): string {
    if (input.length <= maxString) return input;
    return input.slice(0, maxString) + '…';
  }

  function format(val: any, depth: number): string {
    if (val === null) return 'null';
    const type = typeof val;
    if (type === 'string') return JSON.stringify(truncateString(val));
    if (type === 'number' || type === 'boolean') return String(val);
    if (type === 'bigint') return String(val) + 'n';
    if (type === 'undefined') return 'undefined';
    if (type === 'function') return `[Function ${val.name || 'anonymous'}]`;
    if (type === 'symbol') return String(val);

    if (depth > maxDepth) return '…';

    if (Array.isArray(val)) {
      const items: string[] = [];
      const len = Math.min(val.length, maxKeys);
      for (let i = 0; i < len; i++) {
        items.push(format(val[i], depth + 1));
      }
      if (val.length > len) items.push('…');
      return `[${items.join(', ')}]`;
    }

    if (type === 'object') {
      if (seen.has(val)) return '[Circular]';
      seen.add(val);
      const keys = Object.keys(val);
      const shown = keys.slice(0, maxKeys);
      const parts: string[] = [];
      for (const key of shown) {
        try {
          parts.push(`${key}: ${format((val as any)[key], depth + 1)}`);
        } catch {
          parts.push(`${key}: [Unable to read]`);
        }
      }
      if (keys.length > shown.length) parts.push('…');
      return `{ ${parts.join(', ')} }`;
    }

    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }

  try {
    return format(value, 0);
  } catch (e) {
    return '[Unserializable props]';
  }
}
