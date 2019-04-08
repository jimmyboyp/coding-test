module.exports = {
  app: {
    APP_PORT: process.env.APP_PORT || 4000
  },
  eventStreamCache: {
    EVENT_STREAM_CACHE_HOST: process.env.EVENT_STREAM_CACHE_HOST || 'localhost',
    EVENT_STREAM_CACHE_PORT: process.env.EVENT_STREAM_CACHE_PORT || 6379,
  },
  AUTH_API: process.env.AUTH_API || 'http://localhost:5000'
}
