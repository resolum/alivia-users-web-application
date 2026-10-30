/**
 * JSON collection kept in this browser for contexts whose backend contract is
 * still pending. The seed is written on first read so edits survive reloads.
 */
export class LocalCollection<T extends { readonly id: string }> {
  private readonly key: string;
  private readonly seed: () => T[];
  private memory: T[] | null = null;

  constructor(key: string, seed: () => T[]) {
    this.key = key;
    this.seed = seed;
  }

  all(): T[] {
    if (this.memory) return this.memory;
    try {
      const raw = window.localStorage.getItem(this.key);
      this.memory = raw ? (JSON.parse(raw) as T[]) : this.seed();
    } catch {
      this.memory = this.seed();
    }
    return this.memory;
  }

  find(id: string): T | undefined {
    return this.all().find((item) => item.id === id);
  }

  save(item: T): T {
    const items = this.all();
    const index = items.findIndex((candidate) => candidate.id === item.id);
    this.write(index === -1 ? [item, ...items] : items.map((it, i) => (i === index ? item : it)));
    return item;
  }

  replaceAll(items: T[]): void {
    this.write(items);
  }

  private write(items: T[]): void {
    this.memory = items;
    try {
      window.localStorage.setItem(this.key, JSON.stringify(items));
    } catch {
      // Storage may be full or blocked; the in-memory copy still serves this visit.
    }
  }
}

/** Resolves after a short delay so loading states are exercised like a real request. */
export function respond<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), 250));
}
