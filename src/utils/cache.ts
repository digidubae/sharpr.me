type CacheEntry<T = any> = {
    data: T;
    expiresAt: number;
};

const cache = new Map<string, CacheEntry>();


export function getCached<T = any>(key: string): T | null {
    const entry = cache.get(key);
    if (entry && entry.expiresAt > Date.now()) {
        return entry.data as T;
    }
    // Remove expired entries.
    cache.delete(key);
    return null;
}

export function setCached<T = any>(key: string, data: T, ttl: number): void {
    const expiresAt = Date.now() + ttl;
    cache.set(key, { data, expiresAt });
}


export function invalidateCache(key: string): void {
    cache.delete(key);
}
