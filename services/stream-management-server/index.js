const Koa = require('koa');
const axios = require('axios');
const redis = require('redis');
const Router = require('koa-router');
const cookieParser = require('koa-cookie').default;

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

const eventStreamCache = redis.createClient({
  host: EVENT_STREAM_CACHE_HOST,
  port: EVENT_STREAM_CACHE_PORT
});

function setCtxHeaders(ctx, headers = {}) {
  Object.keys(headers)
    .forEach(headerKey => ctx.set(headerKey, headers[headerKey]));
}

function convertCookieObjectToString(cookies) {
  return Object.keys(cookies)
    .reduce((acc, cookieName) => `${acc}${cookieName}=${cookies[cookieName]}; `, '');
}

router.post(
  '/authorized/check',
  async function authorizeCheckHandler(ctx, next) {
    const sessionCheckUrl = `${AUTH_API}/session/check`;
    const cookieString = convertCookieObjectToString(ctx.cookie);
    const options = { headers: { Cookie: cookieString } };

    try {
      const {
        data,
        status,
        headers
      } = await axios.post(sessionCheckUrl, {}, options);

      if (status === 200) {
        const concurrentStreams = await new Promise((resolve, reject) => {
          eventStreamCache.get(data.userHash, (error, value) => {
            if (error) reject(error);
            console.log('EVENT STREAM CACHE GET: value')
            console.log(value)
            resolve(value);
          });
        });

        if (concurrentStreams < 3) {
          await new Promise((resolve, reject) => {
            // const expiry = 300; // 5 mins in seconds
            // eventStreamCache.set(key, value, 'EX', expiry, (error, value) => {
            //   if (error) reject(error);

            //   console.log('EVENT STREAM CACHE SETTING:', value)
            //   console.log(value)
            //   resolve(value);
            // });
            resolve()
          });

          ctx.status = status;
          ctx.body = data;
        } else {
          ctx.set('WWW-Authenticate', 'Basic realm="Dazn"');
          ctx.body = { error: 'Maximum number of concurrent streams reached.' };
          ctx.status = 401;
        }
      } else {
        ctx.status = 401;
        ctx.body = data;
        setCtxHeaders(ctx, headers);
      }
    } catch (error) {
      const { response } = error;

      if (response) {
        ctx.body = response.data;
        ctx.status = response.status;
        setCtxHeaders(ctx, response.headers);
      } else {
        console.error(error);
        ctx.body = { error: 'An error occurred.' };
        ctx.status = 500;
      }

      // Log error
    }

    await next();
  }
);

app.use(cookieParser());
app.use(router.routes());

app.on('error', (error, ctx) => {
  console.error(error);
});

console.info(`App listening on ${APP_PORT}`);

module.exports = app.listen(APP_PORT);
