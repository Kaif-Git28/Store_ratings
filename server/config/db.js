const { Sequelize } = require('sequelize');
const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Default connection string
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/store_rating_db';
const dbName = connectionString.split('/').pop();

const sequelize = new Sequelize(
  process.env.DATABASE_URL
    ? process.env.DATABASE_URL
    : {
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'store_rating_db',
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
          ssl: process.env.NODE_ENV === 'production' ? {
            require: true,
            rejectUnauthorized: false
          } : false
        }
      }
);

// Connect to the database, creating it if it doesn't exist
const connectDB = async () => {
  try {
    // First try to connect to postgres to check if our database exists
    const client = new Client({
      connectionString: connectionString.replace(dbName, 'postgres'), // Connect to default postgres database
      statement_timeout: 5000,
    });

    await client.connect();
    
    // Check if our target database exists
    const checkResult = await client.query(`
      SELECT 1 FROM pg_database WHERE datname = '${dbName}'
    `);
    
    // If database doesn't exist, create it
    if (checkResult.rows.length === 0) {
      console.log(`Database ${dbName} doesn't exist, creating it...`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database ${dbName} created successfully`);
    }
    
    await client.end();

    // Now try to connect to our target database
    await sequelize.authenticate();
    console.log('Database connection established successfully');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    console.log('Please make sure PostgreSQL is running and the database credentials are correct');
    // Don't exit the process, just log the error
  }
};

module.exports = { sequelize, connectDB }; 