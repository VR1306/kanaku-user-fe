/**
 * Tiny per-process TTL map for hot lookups (e.g. "is this session still valid"). Each Atlas round trip costs
 * ~40–50 ms, so skipping a lookup on every request is the cheapest speed-up. Writers call `delete`/`clear` so
 * sign-outs and edits apply at once on this instance; other instances catch up within `ttlMs`.
 */
export function ttlCache<V>(ttlMs: number, max = 1000) {
  const m = new Map<string, { v: V; exp: number }>();
  return {
    get(k: string): V | undefined {
      const e = m.get(k);
      if (!e) return undefined;
      if (e.exp < Date.now()) {
        m.delete(k);
        return undefined;
      }
      return e.v;
    },
    set(k: string, v: V) {
      if (m.size >= max) m.delete(m.keys().next().value as string);
      m.set(k, { v, exp: Date.now() + ttlMs });
    },
    delete: (k: string) => void m.delete(k),
    clear: () => m.clear(),
  };
}
