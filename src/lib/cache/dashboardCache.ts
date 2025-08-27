import { getRedisClient } from './redis';

const redis = getRedisClient();

export const dashboardCache = {
  TTL: { metrics: 300, activity: 120, health: 60, quick: 60 },
  async get<T>(key: string): Promise<T | null> {
    try {
      const v = await redis.get(key);
      return v ? (JSON.parse(v) as T) : null;
    } catch {
      return null;
    }
  },
  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch {
      // ignore
    }
  },
};
