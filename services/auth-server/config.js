module.exports = {
  app: {
    APP_PORT: process.env.APP_PORT || 5000,
    JWT_SECRET: process.env.JWT_SECRET || 'secret',
    SESSION_EXPIRY_SECONDS: process.env.SESSION_EXPIRY_SECONDS || 3600
  },
  sessionCache: {
    SESSION_CACHE_HOST: process.env.SESSION_CACHE_HOST || 'session_cache',
    SESSION_CACHE_PORT: process.env.SESSION_CACHE_PORT || 6379,
  },
  userDatabase: {
    USER_DB_HOST: process.env.USER_DB_HOST || 'user_database',
    USER_DB_PORT: process.env.USER_DB_PORT || 3306,
    USER_DB_USER: process.env.USER_DB_USER || 'root',
    USER_DB_PASS: process.env.USER_DB_PASS,
    USER_DB_DATABASE: process.env.USER_DB_DATABASE || 'users'
  }
}
