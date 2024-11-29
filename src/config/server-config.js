const dotenv = require('dotenv');
dotenv.config(); // load env file

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET,
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
};
