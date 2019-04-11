const returnResults = (resolve, reject) => (error, result) => {
  if (error) reject(error);
  resolve(result);
};

module.exports = {
  cache: {
    getListLength: (client, key) => (
      new Promise((resolve, reject) => (
        client.llen(key, returnResults(resolve, reject))
      ))
    ),
    pushToList: (client, key, value, expiry) => (
      new Promise((resolve, reject) => (
        client.lpush(key, value, returnResults(resolve, reject))
      ))
    ),
    flushall: (client) => (
      new Promise((resolve, reject) => (
        client.flushall(returnResults(resolve, reject))
      ))
    )
  },
};
