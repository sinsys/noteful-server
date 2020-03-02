require('dotenv').config();

module.exports = {
  "migrationDirectory": "db/migrations",
  "driver": "pg",
  "connectionString": 
    (process.env.NODE_ENV === 'test')
      ? process.env.TEST_DB_URL
      : process.env.DB_URL
};