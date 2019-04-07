const koa = require('koa');
const bodyParser = require('koa-bodyparser');

function responseHandler(ctx, next) {
  const { password } = ctx.request.body;

  if (password === 'johns_password') {
    ctx.cookies.set('session', 'THE_JWT');
    ctx.status = 204;
  } else {
    ctx.set('WWW-Authenticate', 'Dazn');
    ctx.status = 401;
  }

  return next();
}

const app = new koa();

app.use(bodyParser());
app.use(responseHandler);

module.exports = app.listen(3000);
