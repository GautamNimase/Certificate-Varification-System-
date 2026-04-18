const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create Sequelize instance for MySQL database
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'production' ? false : console.log,
    
    // Production-optimized connection pool
    pool: {
        max: 5,
        min: 0,
        acquire: 60000,
        idle: 30000,
        evict: 10000
    },
    
    define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true
    },
    
    // SSL required for Aiven MySQL
    dialectOptions: {
        charset: 'utf8mb4',
        ssl: {
            rejectUnauthorized: false  // Aiven uses self-signed certs
        }
    }
});

// Test database connection with retries (for production reliability)
const testConnection = async (maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await sequelize.authenticate();
            console.log(`✅ Database connection established successfully (attempt ${attempt})`);
            return;
        } catch (error) {
            console.warn(`⚠️ Database connection attempt ${attempt} failed:`, error.message);
            if (attempt === maxRetries) {
                console.error('❌ Failed to connect to database after', maxRetries, 'attempts');
                console.error('Connection details (masked):', {
                    host: process.env.DB_HOST ? `${process.env.DB_HOST.split('.')[0]}...` : 'unset',
                    port: process.env.DB_PORT || 'unset',
                    database: process.env.DB_NAME || 'unset'
                });
                process.exit(1);
            }
            await new Promise(resolve => setTimeout(resolve, 5000 * attempt)); // Exponential backoff
        }
    }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing database connections...');
    await sequelize.close();
    process.exit(0);
});

module.exports = {
    sequelize,
    testConnection
};

