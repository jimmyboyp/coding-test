const Koa = require('koa');
const Router = require('koa-router');
const axios = require('axios')

const {
  authAPI,
  app: { port }
} = require('./config');

const app = new Koa();
const router = new Router();

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
        // check Redis for no. concurrent streams using hashed userID returned by auth server
        const concurrentStreams = 2;

        // if (concurrentStreams < 3) {
        //   ctx.status = status;
        // } else {
        //   ctx.set('WWW-Authenticate', 'Basic realm="Dazn"');
        //   ctx.body = { error: 'Maximum number of concurrent streams reached.' };
        //   ctx.status = 401;
        // }
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

module.exports = app.listen(port);
