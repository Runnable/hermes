/**
 * @module test/fixtures/connection-opts
 */

module.exports = {
  standard: {
    hostname: 'bobsburgers.net',
    port: '1111',
    username: 'tom',
    password: 'harry'
  },
  noSpecPort: {
    hostname: 'bobsburgers.net',
    port: null,
    username: 'tom',
    password: 'harry'
  },
};
