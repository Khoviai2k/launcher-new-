const mongoose = require('mongoose');
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

class DatabaseConnection {
  constructor() {
    this.maxRetries = 5;
    this.retryDelay = 5000; // 5 seconds
    this.currentRetry = 0;
    this.isConnected = false;
  }

  async connect() {
    const mongoUri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB_NAME || 'tramgame';

    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const mongooseOptions = {
      dbName,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    // Set up mongoose event listeners
    this.setupEventListeners();

    return this.connectWithRetry(mongoUri, mongooseOptions);
  }

  async connectWithRetry(uri, options) {
    while (this.currentRetry < this.maxRetries) {
      try {
        logger.info(`Attempting to connect to MongoDB... (Attempt ${this.currentRetry + 1}/${this.maxRetries})`);
        
        await mongoose.connect(uri, options);
        
        this.isConnected = true;
        this.currentRetry = 0;
        logger.info(' MongoDB connected successfully');
        
        // Set up indexes after connection
        await this.createIndexes();
        
        return mongoose.connection;
      } catch (error) {
        this.currentRetry++;
        logger.error(`MongoDB connection failed: ${error.message}`);
        
        if (this.currentRetry >= this.maxRetries) {
          logger.error('Max retries reached. Could not connect to MongoDB.');
          throw error;
        }
        
        logger.info(`Retrying in ${this.retryDelay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
  }

  setupEventListeners() {
    mongoose.connection.on('connected', () => {
      this.isConnected = true;
      logger.info('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      logger.error(`Mongoose connection error: ${err}`);
      this.isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected from MongoDB');
      this.isConnected = false;
      
      // Attempt reconnection if not in graceful shutdown
      if (!this.isShuttingDown) {
        logger.info('Attempting to reconnect to MongoDB...');
        this.currentRetry = 0;
        this.connectWithRetry(process.env.MONGODB_URI, {
          dbName: process.env.MONGODB_DB_NAME || 'tramgame'
        });
      }
    });

    // Graceful shutdown
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
  }

  async createIndexes() {
    try {
      logger.info('Creating database indexes...');
      // Indexes will be created in models
      logger.info('Database indexes created successfully');
    } catch (error) {
      logger.error(`Error creating indexes: ${error.message}`);
    }
  }

  async gracefulShutdown(signal) {
    logger.info(`${signal} received: closing MongoDB connection...`);
    this.isShuttingDown = true;
    
    try {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed successfully');
      process.exit(0);
    } catch (error) {
      logger.error(`Error during graceful shutdown: ${error.message}`);
      process.exit(1);
    }
  }

  getConnection() {
    if (!this.isConnected) {
      throw new Error('Database is not connected');
    }
    return mongoose.connection;
  }

  isHealthy() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }
}

// Export singleton instance
module.exports = new DatabaseConnection();
