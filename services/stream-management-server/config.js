module.exports = {
  app: {
    port: process.env.PORT || 4000
  },
  eventStreamCache: {
    host: process.env.EVENT_STREAM_CACHE_HOST || 'concurrent_stream_cache',
    port: process.env.EVENT_STREAM_CACHE_PORT || 6379,
  },
  authAPI: process.env.AUTH_API || 'http://localhost:5000'
}
