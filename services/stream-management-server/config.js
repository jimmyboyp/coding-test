module.exports = {
  app: {
    port: process.env.PORT || 4000
  },
  eventStreamCache: {
    host: process.env.SESSION_CACHE_HOST || 'redis',
    port: process.env.SESSION_CACHE_PORT || 6379,
  },
  authAPI: process.env.AUTH_API || 'http://localhost:5000'
}
