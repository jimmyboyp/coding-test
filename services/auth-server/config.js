module.exports = {
  app: {
    port: process.env.PORT || 5000
  },
  sessionCache: {
    host: process.env.SESSION_CACHE_HOST || 'session_cache',
    port: process.env.SESSION_CACHE_PORT || 6379,
  },
  userDatabase: {
    host: process.env.USER_DB_HOST || 'user_database',
    port: process.env.USER_DB_PORT || 3306,
    user: process.env.USER_DB_USER || 'root',
    pass: process.env.USER_DB_PASS,
    database: process.env.USER_DB_DATABASE || 'users'
  }
}
