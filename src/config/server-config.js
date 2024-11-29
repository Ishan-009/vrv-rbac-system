const dotenv = require('dotenv');
dotenv.config(); // load env file

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET,
  PORT: process.env.PORT || 3000,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_EXPIRY: process.env.JWT_EXPIRY || '24h',
};
