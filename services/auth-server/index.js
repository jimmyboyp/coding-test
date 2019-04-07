const koa = require('koa');

const app = new koa();

function responseHandler(ctx, next) {
  ctx.cookies.set('session', 'THE_JWT');
  ctx.status = 204;
  return next()
}

app.use(responseHandler);

module.exports = app.listen(3000);
