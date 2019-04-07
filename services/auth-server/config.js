module.exports = {
  app: {
    port: process.env.PORT || 5000
  },
  sessionCache: {
    host: process.env.SESSION_CACHE_HOST || 'session_cache',
    port: process.env.SESSION_CACHE_PORT || 6379,
  },
  userDatabase: {
    host: process.env.DB_HOST || 'user_database',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    pass: process.env.DB_PASS,
    database: process.env.DB_DATABASE || 'users'
  }
}
