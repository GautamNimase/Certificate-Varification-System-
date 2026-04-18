const { Sequelize } = require('sequelize');
require('dotenv').config();

// Parse DATABASE_URL for Neon PostgreSQL (Render auto-provides)
const databaseUrl = process.env.DATABASE_URL;
let sequelize;

if (databaseUrl) {
    // Production: DATABASE_URL from Neon/Render
    const sequelizeUrl = databaseUrl.replace('postgres://', 'postgresql://');
    sequelize = new Sequelize(sequelizeUrl, {
        dialect: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false  // Neon self-signed certs
            },
            // Keep-alive for serverless (Neon suspends idle connections)
            keepAlive: true,
            keepAliveInitialDelayMillis: 0
        },
        logging: process.env.NODE_ENV === 'production' ? false : console.log,
        pool: {
            max: 5,
            min: 0,
            acquire: 60000,
            idle: 10000  // Reduced for serverless
        },
        define: {
            timestamps: true,
            underscored: true,
            freezeTableName: true
        }
    });
    console.log('🚀 Using DATABASE_URL (PostgreSQL/Neon)');
} else {
    // Local dev fallback (update .env with PG_NAME, PG_USER etc.)
    sequelize = new Sequelize(
        process.env.PG_NAME || process.env.DB_NAME,
        process.env.PG_USER || process.env.DB_USER,
        process.env.PG_PASSWORD || process.env.DB_PASSWORD,
        {
            host: process.env.PG_HOST || process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.PG_PORT || process.env.DB_PORT || 5432),
            dialect: 'postgres',
            logging: process.env.NODE_ENV === 'production' ? false : console.log,
            pool: {
                max: 5,
                min: 0,
                acquire: 60000,
                idle: 10000
            },
            define: {
                timestamps: true,
                underscored: true,
                freezeTableName: true
            },
            dialectOptions: {
                ssl: process.env.NODE_ENV === 'production' ? {
                    rejectUnauthorized: false
                } : false
            }
        }
    );
    console.log('🏠 Local PostgreSQL mode');
}

// Test connection with retries (production-ready)
const testConnection = async (maxRetries = 5) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await sequelize.authenticate();
            console.log(`✅ PostgreSQL connection OK (attempt ${attempt})`);
            return true;
        } catch (error) {
            console.warn(`⚠️ PG connection attempt ${attempt} failed:`, error.message);
            if (attempt === maxRetries) {
                console.error('❌ PostgreSQL connection failed after', maxRetries, 'retries');
                console.error('Check: DATABASE_URL env var, Neon DB status, network');
                process.exit(1);
            }
            // Serverless backoff (Neon cold starts)
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        }
    }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM: Closing PostgreSQL pool...');
    await sequelize.close();
    process.exit(0);
});

module.exports = { sequelize, testConnection };

