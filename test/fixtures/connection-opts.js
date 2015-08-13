/**
 * @module test/fixtures/connection-opts
 */

module.exports = {
  standard: {
    hostname: 'bobsburgers.net',
    port: '1111',
    username: 'tom',
    password: 'harry',
    queues: ['a', 'b']
  },
  noSpecPort: {
    hostname: 'bobsburgers.net',
    port: null,
    username: 'tom',
    password: 'harry',
    queues: ['a', 'b']
  },
  noQueues: {
    hostname: 'bobsburgers.net',
    port: '1111',
    username: 'tom',
    password: 'harry'
  },
  malformedQueues: {
    hostname: 'bobsburgers.net',
    port: '1111',
    username: 'tom',
    password: 'harry',
    queues: 'woot'
  },
  malformedQueuesBadEntries: {
    hostname: 'bobsburgers.net',
    port: '1111',
    username: 'tom',
    password: 'harry',
    queues: ['good', 'good', { bad: 'bad' }]
  }
};
