const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const cookieParser = require('koa-cookie').default;

const {
  app: { port }
} = require('./config');

const app = new Koa();
const router = new Router();

router.post(
  '/login',
  function authHandler(ctx, next) {
    const { password } = ctx.request.body;

    if (password === 'johns_password') {
      ctx.cookies.set('session', 'THE_JWT');
      ctx.status = 204;
    } else {
      ctx.set('WWW-Authenticate', 'Basic realm="Dazn"');
      ctx.body = { error: 'Failed to authenticate.' };
      ctx.status = 401;
    }

    return next();
  }
);

router.post(
  '/session/check',
  function sessionHandler(ctx, next) {
    const { session } = ctx.cookie || {};

    if (session === 'THE_JWT') {
      ctx.status = 200;
      ctx.body = { userHash: 'HASH_OF_USERNAME' };
    } else {
      ctx.set('WWW-Authenticate', 'Basic realm="Dazn"');
      ctx.body = { error: 'No active session found for this user.' };
      ctx.status = 401;
    }

    return next();
  }
);

app.use(bodyParser());
app.use(cookieParser());
app.use(router.routes());

module.exports = app.listen(port);
