// --- LocalStorage Wrapper ---
// Provides a promise-based async interface for localStorage,
// mimicking the interface of more advanced storage APIs.

export class LocalStorage {
  static async getItem<T>(key: string): Promise<T | null> {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : null;
    } catch (error) {
      console.error(`Error getting item ${key} from localStorage`, error);
      return null;
    }
  }

  static async setItem(key: string, value: string): Promise<void> {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      console.error(`Error setting item ${key} in localStorage`, error);
    }
  }

  static async removeItem(key: string): Promise<void> {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item ${key} from localStorage`, error);
    }
  }
}


// --- Simple In-Memory Cache ---
// A basic implementation of a cache that stores data in a Map.
// This is used by the more specific caches like AgentRunCache.

interface CacheOptions {
  namespace?: string;
  capacity?: number;
}

export class Cache {
  private readonly namespace: string;
  private readonly capacity: number;
  private store: Map<string, string>;

  constructor(options: CacheOptions = {}) {
    this.namespace = options.namespace || "default";
    this.capacity = options.capacity || 1024 * 1024; // 1MB default
    this.store = new Map<string, string>();
  }

  private getKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  get(key: string): string | undefined {
    return this.store.get(this.getKey(key));
  }

  set(key: string, value: string): void {
    // Note: A real implementation would handle capacity limits here.
    // For this app, we'll keep it simple.
    this.store.set(this.getKey(key), value);
  }

  remove(key: string): void {
    this.store.delete(this.getKey(key));
  }

  clear(): void {
    this.store.clear();
  }
}