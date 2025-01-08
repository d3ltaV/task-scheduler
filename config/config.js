require('dotenv').config();
module.exports = {
  development: {
    username: process.env.DEV_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DEV_DATABASE,
    host: process.env.DEV_HOST,
    // dialect: process.env.DB_DIALECT,
    dialect: 'mysql',
  },
  test: {
    username: process.env.TEST_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.TEST_DATABASE,
    host: process.env.TEST_HOST,
    dialect: process.env.DB_DIALECT,
  },
  production: {
    username: process.env.PROD_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.PROD_DATABASE,
    host: process.env.PROD_HOST,
    dialect: process.env.DB_DIALECT,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
};