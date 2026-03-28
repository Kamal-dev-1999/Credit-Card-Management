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
 * @param {number} ttl - Time to live in seconds (default: 3600 = 1 hour). Set to 0 to bypass cache entirely.
 * @returns {object} - Cached or fresh data
 */
const getCachedData = async (key, fetchFunction, ttl = 3600) => {
  try {
    // If ttl is 0, bypass cache completely and fetch fresh data
    if (ttl === 0) {
      const data = await fetchFunction();
      
      // Delete old cache key if it exists
      try {
        if (isConnected && redisClient) {
          await redisClient.del(key);
        }
      } catch (delErr) {
        // Cache deletion failed, continue
      }
      
      return data;
    }

    if (!isConnected || !redisClient) {
      return await fetchFunction();
    }

    // Try to get from cache
    try {
      const cached = await redisClient.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (redisErr) {
      console.warn(`⚠️  Cache retrieval failed: ${redisErr.message}`);
    }

    // Cache miss - fetch from DB
    const data = await fetchFunction();

    // Try to cache the result
    try {
      if (data) {
        await redisClient.setEx(key, ttl, JSON.stringify(data));
      }
    } catch (redisErr) {
      console.warn(`⚠️  Cache write failed: ${redisErr.message}`);
    }

    return data;
  } catch (err) {
    console.error(`❌ Data fetch failed`);
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
  } catch (err) {
    console.warn(`⚠️  Cache deletion failed: ${err.message}`);
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
    }
  } catch (err) {
    console.warn(`⚠️  Cache pattern deletion failed: ${err.message}`);
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
      return true;
    }

    return false;
  } catch (err) {
    console.warn(`⚠️  Lock operation failed: ${err.message}`);
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
  } catch (err) {
    console.warn(`⚠️  Lock operation failed: ${err.message}`);
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
