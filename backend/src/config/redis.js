const redis = require('redis');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

class RedisConnection {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.maxRetries = 5;
    this.retryDelay = 3000; // 3 seconds
  }

  async connect() {
    const redisConfig = {
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        reconnectStrategy: (retries) => {
          if (retries > this.maxRetries) {
            logger.error('Max Redis reconnection attempts reached');
            return new Error('Max reconnection attempts reached');
          }
          return Math.min(retries * 100, 3000);
        }
      },
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD,
      database: parseInt(process.env.REDIS_DB || '0')
    };

    try {
      this.client = redis.createClient(redisConfig);

      // Set up event listeners
      this.setupEventListeners();

      // Connect to Redis
      await this.client.connect();
      
      this.isConnected = true;
      logger.info(' Redis connected successfully');
      
      // Test connection
      await this.client.ping();
      
      return this.client;
    } catch (error) {
      logger.error(`Failed to connect to Redis: ${error.message}`);
      
      // If Redis fails, the app can still work with degraded functionality
      if (process.env.NODE_ENV === 'production') {
        logger.warn('Running without Redis cache - degraded performance mode');
        return null;
      }
      
      throw error;
    }
  }

  setupEventListeners() {
    if (!this.client) return;

    this.client.on('connect', () => {
      logger.info('Redis client connected');
      this.isConnected = true;
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready');
    });

    this.client.on('error', (err) => {
      logger.error(`Redis client error: ${err.message}`);
      this.isConnected = false;
    });

    this.client.on('end', () => {
      logger.warn('Redis client connection closed');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis client reconnecting...');
    });

    // Graceful shutdown
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
  }

  async gracefulShutdown(signal) {
    logger.info(`${signal} received: closing Redis connection...`);
    
    if (this.client) {
      try {
        await this.client.quit();
        logger.info('Redis connection closed successfully');
      } catch (error) {
        logger.error(`Error closing Redis connection: ${error.message}`);
      }
    }
  }

  getClient() {
    if (!this.client) {
      logger.warn('Redis client not available - degraded mode');
      return null;
    }
    return this.client;
  }

  isHealthy() {
    return this.isConnected && this.client && this.client.isReady;
  }

  // Cache helper methods
  async get(key) {
    if (!this.client) return null;
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Redis get error for key ${key}: ${error.message}`);
      return null;
    }
  }

  async set(key, value, ttl = null) {
    if (!this.client) return false;
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.client.setEx(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (error) {
      logger.error(`Redis set error for key ${key}: ${error.message}`);
      return false;
    }
  }

  async del(key) {
    if (!this.client) return false;
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error(`Redis delete error for key ${key}: ${error.message}`);
      return false;
    }
  }

  async exists(key) {
    if (!this.client) return false;
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Redis exists error for key ${key}: ${error.message}`);
      return false;
    }
  }

  async expire(key, ttl) {
    if (!this.client) return false;
    try {
      await this.client.expire(key, ttl);
      return true;
    } catch (error) {
      logger.error(`Redis expire error for key ${key}: ${error.message}`);
      return false;
    }
  }

  // Session management helpers
  async setSession(sessionId, data, ttl = 86400) {
    const key = `session:${sessionId}`;
    return await this.set(key, data, ttl);
  }

  async getSession(sessionId) {
    const key = `session:${sessionId}`;
    return await this.get(key);
  }

  async deleteSession(sessionId) {
    const key = `session:${sessionId}`;
    return await this.del(key);
  }

  // Rate limiting helpers
  async incrementRateLimit(identifier, window = 60) {
    if (!this.client) return { count: 0, ttl: window };
    
    const key = `rate:${identifier}`;
    try {
      const count = await this.client.incr(key);
      if (count === 1) {
        await this.client.expire(key, window);
      }
      const ttl = await this.client.ttl(key);
      return { count, ttl };
    } catch (error) {
      logger.error(`Rate limit error for ${identifier}: ${error.message}`);
      return { count: 0, ttl: window };
    }
  }
}

// Export singleton instance
module.exports = new RedisConnection();
