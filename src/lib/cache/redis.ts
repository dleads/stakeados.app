import Redis from 'ioredis';

let redis: Redis | null = null;

// Cliente simulado para entornos de test o cuando Redis está deshabilitado
function getMockRedis(): Redis {
  const mock: any = {
    on: () => {},
    ping: async () => 'PONG',
    quit: async () => {},
    get: async () => null,
    set: async () => {},
    setex: async () => {},
  };
  return mock as Redis;
}

function isTruthy(v: string | undefined): boolean {
  if (!v) return false;
  const val = v.toLowerCase();
  return val === 'true' || val === '1' || val === 'yes' || val === 'on';
}

export function getRedisClient(): Redis {
  const isNetlify = isTruthy(process.env.NETLIFY);
  const disableRedisEnv = isTruthy(process.env.REDIS_DISABLED);
  const disableRedis = process.env.NODE_ENV === 'test' || disableRedisEnv || isNetlify;

  if (disableRedis) {
    return getMockRedis();
  }

  if (!redis) {
    const redisUrl = process.env.REDIS_URL;

    // Si no hay REDIS_URL configurado, usar mock para evitar conexiones en build/SSR
    if (!redisUrl) {
      return getMockRedis();
    }

    // Inicialización por URL simple
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

  return redis as Redis;
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
