const { createHash } = require('crypto');

const returnResults = (resolve, reject) => (error, result) => {
  if (error) reject(error);
  resolve(result);
};

module.exports = {
  jwt: {
    sign: (jsonwebtoken, payload, secret, options = {}) => (
      new Promise((resolve, reject) => (
        jsonwebtoken.sign(payload, secret, options, returnResults(resolve, reject))
      ))
    ),
    verify: (jsonwebtoken, token, secret, options = {}) => (
      new Promise((resolve, reject) => (
        jsonwebtoken.verify(token, secret, options, returnResults(resolve, reject))
      ))
    )
  },
  cache: {
    get: (client, key) => (
      new Promise((resolve, reject) => (
        client.get(key, returnResults(resolve, reject))
      ))
    ),
    set: (client, key, value, expiry) => (
      new Promise((resolve, reject) => (
        client.set(key, value, 'EX', expiry, returnResults(resolve, reject))
      ))
    ),
    flushall: (client) => (
      new Promise((resolve, reject) => (
        client.flushall(returnResults(resolve, reject))
      ))
    )
  },
  hash: (string) => createHash('md5').update(string).digest("hex")
};
