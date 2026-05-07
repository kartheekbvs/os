import { ErrorHandler } from './error-handler.js';

/**
 * In-memory Cache Layer for JSON payloads
 * Reduces network roundtrips for already visited concepts.
 */
class CacheManager {
  constructor() {
    this.cache = new Map();
  }

  async fetchWithCache(url, version = 'latest') {
    const key = `${url}@${version}`;
    
    if (this.cache.has(key)) {
      performance.mark(`cache_hit_${url}`);
      return this.cache.get(key);
    }

    try {
      performance.mark(`fetch_start_${url}`);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      
      this.cache.set(key, data);
      performance.measure(`fetch_duration_${url}`, `fetch_start_${url}`);
      return data;
      
    } catch (err) {
      ErrorHandler.handleFetchError(`Cache fetch: ${url}`, err);
      throw err;
    }
  }

  invalidate(urlPattern) {
    for (let key of this.cache.keys()) {
      if (key.includes(urlPattern)) {
        this.cache.delete(key);
      }
    }
  }
}

export const ContentCache = new CacheManager();
