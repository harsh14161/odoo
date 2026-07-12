require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');
    await sequelize.sync(); // creates tables if they don't exist
    console.log('Models synchronized.');
    app.listen(PORT, () => console.log(`TransitOps API listening on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
