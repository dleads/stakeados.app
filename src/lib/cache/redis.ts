import Redis from 'ioredis';

let redis: Redis | null = null;

// Cliente simulado para entornos de test o cuando Redis está deshabilitado
function getMockRedis(): Redis {
  const mock: any = {
    on: () => {},
    ping: async () => 'PONG',
    quit: async () => {},
  };
  return mock as Redis;
}

export function getRedisClient(): Redis {
  const disableRedis =
    process.env.NODE_ENV === 'test' || process.env.REDIS_DISABLED === 'true';
  if (disableRedis) {
    return getMockRedis();
  }

  if (!redis) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    // Use simple URL-based initialization to avoid option type mismatches
    redis = new Redis(redisUrl);

    redis.on('error', error => {
      console.error('Redis connection error:', error);
    });

    redis.on('connect', () => {
      console.log('Redis connected successfully');
    });

    redis.on('ready', () => {
      console.log('Redis ready to accept commands');
    });
  }

  return redis;
}

export async function closeRedisConnection(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

// Health check function
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const client = getRedisClient();
    const result = await client.ping();
    return result === 'PONG';
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}
