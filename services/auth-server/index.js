const Koa = require('koa');
const redis = require('redis');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const jsonwebtoken = require('jsonwebtoken');
const cookieParser = require('koa-cookie').default;

const { jwt, cache, hash } = require('./helpers');

const {
  app: {
    APP_PORT,
    JWT_SECRET,
    SESSION_EXPIRY_SECONDS,
  },
  sessionCache: {
    SESSION_CACHE_HOST,
    SESSION_CACHE_PORT
  }
} = require('./config');

const app = new Koa();
const router = new Router();

const sessionCache = redis.createClient({
  host: SESSION_CACHE_HOST,
  port: SESSION_CACHE_PORT
});

router.post(
  '/login',
  async function authHandler(ctx, next) {
    const { username, password } = ctx.request.body;

    // Eventually replace this with a database call
    if (username === 'john' && password === 'johns_password') {
      try {
        await cache.set(sessionCache, username, SESSION_EXPIRY_SECONDS, SESSION_EXPIRY_SECONDS);

        try {
          const token = await jwt.sign(
            jsonwebtoken,
            { iss: 'dazn', sub: username },
            JWT_SECRET,
            { expiresIn: SESSION_EXPIRY_SECONDS }
          );

          ctx.cookies.set('session', token);
          ctx.status = 204;
        } catch (error) {
          console.error('Unable to sign jwt:', error);

          ctx.set('WWW-Authenticate', 'Basic realm="Dazn"');
          ctx.body = { error: 'Failed to authenticate.' };
          ctx.status = 401;

          // Log event to message queue
        }
      } catch (error) {
        console.error('Unable to save session:', error);

        ctx.set('WWW-Authenticate', 'Basic realm="Dazn"');
        ctx.body = { error: 'Failed to authenticate.' };
        ctx.status = 401;

        // Log event to message queue
      }
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
  async function sessionHandler(ctx, next) {
    const { session } = ctx.cookie || {};

    try {
      const { sub } = await jwt.verify(jsonwebtoken, session, JWT_SECRET);

      const sessionFromCache = await cache.get(sessionCache, sub);

      if (sessionFromCache) {
        ctx.status = 200;
        ctx.body = { userHash: hash(sub) };
      } else {
        throw new Error('No active session found for this user.');
      }
    } catch (error) {
      console.error('Session check failed:', error);

      ctx.set('WWW-Authenticate', 'Basic realm="Dazn"');
      ctx.body = { error: error.message };
      ctx.status = 401;

      // Log event to message queue
    }

    return next();
  }
);

// Helper route for testing the API
router.get(
  '/flushall',
  async function flushCache(ctx, next) {
    try {
      await cache.flushall(sessionCache);
    } catch (error) {
      console.error('Unable to flush cache:', error);

      ctx.body = { error: error.message };
      ctx.status = 500;
    }

    return next();
  }
);

app.use(bodyParser());
app.use(cookieParser());
app.use(router.routes());

app.on('error', (error, ctx) => {
  console.error(error);
});

console.info(`App listening on ${APP_PORT}`);

module.exports = app.listen(APP_PORT);
