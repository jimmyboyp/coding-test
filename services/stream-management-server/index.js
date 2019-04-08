const Koa = require('koa');
const axios = require('axios');
const redis = require('redis');
const Router = require('koa-router');

const {
  AUTH_API,
  app: {
    APP_PORT
  },
  eventStreamCache: {
    EVENT_STREAM_CACHE_HOST,
    EVENT_STREAM_CACHE_PORT
  }
} = require('./config');

const app = new Koa();
const router = new Router();

const client = redis.createClient({
  host: EVENT_STREAM_CACHE_HOST,
  port: EVENT_STREAM_CACHE_PORT
});

function setCtxHeaders(ctx, headers) {
  Object.keys(headers)
    .forEach(headerKey => ctx.set(headerKey, headers[headerKey]));
}

router.post(
  '/authorized/check',
  async function authorizeCheckHandler(ctx, next) {
    try {
      const {
        data,
        status,
        headers
      } = await axios.post(
        `${AUTH_API}/session/check`,
        {
          username: 'john',
          password: 'johns_password'
        },
        {
          headers: {
            Cookie: 'session=THE_JWT'
          }
        }
      );

      if (status === 204) {
        const concurrentStreams = await new Promise((resolve, reject) => {
          client.get(data.userHash, (error, value) => {
            if (error) reject(error);
            resolve(value);
          });
        });

        if (concurrentStreams < 3) {
          ctx.status = status;
        } else {
          ctx.set('WWW-Authenticate', 'Basic realm="Dazn"');
          ctx.body = { error: 'Maximum number of concurrent streams reached.' };
          ctx.status = 401;
        }
      } else {
        ctx.status = status;
        ctx.body = data;

        setCtxHeaders(ctx, headers);
      }
    } catch ({ data, status, headers }) {
      ctx.status = status;
      ctx.body = data;
      setCtxHeaders(ctx, headers);
    }

    await next();
  }
);

app.use(router.routes());

app.on('error', (error, ctx) => {
  console.error(error);
});

module.exports = app.listen(APP_PORT);
