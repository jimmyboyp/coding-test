const Koa = require('koa');
const Router = require('koa-router');
const axios = require('axios');
const redis = require('redis');

const {
  authAPI,
  app: {
    port: appPort
  },
  eventStreamCache: {
    host,
    port: eventStreamCachePort
  }
} = require('./config');

const app = new Koa();
const router = new Router();

const client = redis.createClient({
  host,
  port: eventStreamCachePort
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
      } = await axios.post(`${authAPI}/session/check`); // Need to pass request cookies

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

console.info(`App listening on ${appPort}`);

axios.post(
  `${authAPI}/session/check`,
  {
    username: 'john',
    password: 'johns_password'
  },
  {
    headers: {
      Cookie: 'session=THE_JWT'
    }
  }
)
.then(() => console.log('axios request made'))
.catch((err) => console.error('axios error', err))

module.exports = app.listen(appPort);
