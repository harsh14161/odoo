const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

const dialect = process.env.DB_DIALECT || 'sqlite'; // Default to sqlite if not specified

if (dialect === 'sqlite') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || './database.sqlite',
    logging: false,
  });
} else if (process.env.DATABASE_URL) {
  // Full connection string (e.g. Neon, Supabase, Render, Heroku Postgres).
  // These hosted providers require SSL; rejectUnauthorized:false is standard
  // for Neon's pooled connections since they use a managed cert chain.
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  });
} else {
  // Local/self-hosted Postgres via discrete env vars.
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: 'postgres',
      logging: false,
    }
  );
}

module.exports = sequelize;
