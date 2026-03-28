const redis = require('redis');

let redisClient = null;
let isConnected = false;

/**
 * Initialize Redis client with automatic fallback
 */
const initRedis = async () => {
  if (redisClient && isConnected) {
    return redisClient;
  }

  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.warn('⚠️  Redis reconnection failed after 10 attempts. Using fallback.');
            return new Error('Redis max retries exceeded');
          }
          return Math.min(retries * 50, 500);
        }
      }
    });

    redisClient.on('error', (err) => {
      console.warn(`⚠️  Redis Error: ${err.message}`);
      isConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected');
      isConnected = true;
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis ready');
      isConnected = true;
    });

    await redisClient.connect();
    isConnected = true;
    console.log('🔴 Redis initialization successful');
    return redisClient;
  } catch (err) {
    console.warn(`⚠️  Redis connection failed: ${err.message}. Operating without cache.`);
    isConnected = false;
    return null;
  }
};

/**
 * Cache-Aside Pattern Implementation
 * @param {string} key - Cache key
 * @param {function} fetchFunction - Function that fetches data from DB
 * @param {number} ttl - Time to live in seconds (default: 3600 = 1 hour)
 * @returns {object} - Cached or fresh data
 */
const getCachedData = async (key, fetchFunction, ttl = 3600) => {
  try {
    if (!isConnected || !redisClient) {
      console.log(`⏭️  Cache miss (Redis unavailable). Fetching from DB...`);
      return await fetchFunction();
    }

    // Try to get from cache
    try {
      const cached = await redisClient.get(key);
      if (cached) {
        console.log(`✅ CACHE HIT: ${key}`);
        return JSON.parse(cached);
      }
    } catch (redisErr) {
      console.warn(`⚠️  Redis GET failed: ${redisErr.message}`);
    }

    // Cache miss - fetch from DB
    console.log(`⏭️  CACHE MISS: ${key}. Fetching from DB...`);
    const data = await fetchFunction();

    // Try to cache the result
    try {
      if (data) {
        await redisClient.setEx(key, ttl, JSON.stringify(data));
        console.log(`💾 Cached: ${key} (TTL: ${ttl}s)`);
      }
    } catch (redisErr) {
      console.warn(`⚠️  Redis SET failed: ${redisErr.message}`);
    }

    return data;
  } catch (err) {
    console.error(`❌ getCachedData error: ${err.message}`);
    return await fetchFunction();
  }
};

/**
 * Delete cache key
 * @param {string} key - Cache key to delete
 */
const deleteCache = async (key) => {
  try {
    if (!isConnected || !redisClient) return;
    
    const deleted = await redisClient.del(key);
    if (deleted > 0) {
      console.log(`🗑️  Cache invalidated: ${key}`);
    }
  } catch (err) {
    console.warn(`⚠️  Failed to delete cache: ${err.message}`);
  }
};

/**
 * Delete multiple cache keys matching a pattern
 * @param {string} pattern - Key pattern (e.g., user:123:*)
 */
const deleteCachePattern = async (pattern) => {
  try {
    if (!isConnected || !redisClient) return;

    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`🗑️  Invalidated ${keys.length} caches for pattern: ${pattern}`);
    }
  } catch (err) {
    console.warn(`⚠️  Failed to delete cache pattern: ${err.message}`);
  }
};

/**
 * Acquire a distributed lock
 * @param {string} lockKey - Lock key
 * @param {number} ttl - Lock TTL in seconds
 * @returns {boolean} - True if lock acquired
 */
const acquireLock = async (lockKey, ttl = 300) => {
  try {
    if (!isConnected || !redisClient) {
      console.log('⏭️  Lock unavailable (Redis down). Proceeding without lock.');
      return true;
    }

    const result = await redisClient.set(lockKey, 'locked', {
      EX: ttl,
      NX: true // Only set if doesn't exist
    });

    if (result) {
      console.log(`🔐 Lock acquired: ${lockKey} (TTL: ${ttl}s)`);
      return true;
    }

    console.log(`⚠️  Lock already exists: ${lockKey}. Another operation in progress.`);
    return false;
  } catch (err) {
    console.warn(`⚠️  Lock acquisition failed: ${err.message}`);
    return true; // Proceed if Redis fails
  }
};

/**
 * Release a distributed lock
 * @param {string} lockKey - Lock key
 */
const releaseLock = async (lockKey) => {
  try {
    if (!isConnected || !redisClient) return;

    await redisClient.del(lockKey);
    console.log(`🔓 Lock released: ${lockKey}`);
  } catch (err) {
    console.warn(`⚠️  Lock release failed: ${err.message}`);
  }
};

/**
 * Get cache stats
 */
const getCacheStats = async () => {
  try {
    if (!isConnected || !redisClient) {
      return { status: 'disconnected' };
    }

    const info = await redisClient.info('stats');
    return {
      status: 'connected',
      info
    };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
};

module.exports = {
  initRedis,
  getCachedData,
  deleteCache,
  deleteCachePattern,
  acquireLock,
  releaseLock,
  getCacheStats
};
