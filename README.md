Hermes
======

Simplified abstraction interface to [amqp.node](https://github.com/squaremo/amqp.node)

[![Build Status](https://travis-ci.org/Runnable/hermes.svg)](https://travis-ci.org/Runnable/hermes)
[![Code Climate](https://codeclimate.com/github/Runnable/hermes/badges/gpa.svg)](https://codeclimate.com/github/runnable/hermes)
[![Test Coverage](https://codeclimate.com/github/Runnable/hermes/badges/coverage.svg)](https://codeclimate.com/github/runnable/hermes)
[![Dependency Status](https://david-dm.org/Runnable/hermes.svg)](https://david-dm.org/runnable/hermes)
[![devDependency Status](https://david-dm.org/Runnable/hermes/dev-status.svg)](https://david-dm.org/runnable/hermes#info=devDependencies)

[![NPM](https://nodei.co/npm/runnable-hermes.png?compact=true)](https://nodei.co/npm/runnable-hermes/)
[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/Runnable/hermes?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

Publish & subscribe to RabbitMQ queues with simplified publish & subscribe interface
methods.

- Connects to RabbitMQ server, establishes a channel, asserts defined queues
  - Queues will be created as `durabale` queues, not `transient`. `persistent` messages will be saved to disk and survivie broker restarts. [Queue Durability](https://www.rabbitmq.com/tutorials/amqp-concepts.html#queue-durability)
- Automatically buffers publish & subscribe calls until connection is established. (No need to wait for connection to be established before using `publish` or `subscribe` methods from your application.)
- Tracks references to subscribe callbacks and provides functionality to stop receiving jobs for one or all task queues. (Very similar to EventEmitter unsubscribe functionality)
- Automatically encodes objects/strings as buffers on publish and decodes to JS Object literals for subscribe callbacks
- Provides subscribe callback with simplified `done` method to send ack message to RabbitMQ and remove tasks from queue

USAGE
-----
```js
/**
 * Hermes attempts to connect to RabbitMQ upon instantiation,
 * throws if connection fails.
 * If using Events, Hermes will throw if binding or asserting failed
 * during connections
 */
var hermes = require('runnable-hermes').hermesSingletonFactory({
  name: 'service name',
  hostname: 'localhost',
  port: '5672',
  username: 'guest',
  password: 'guest',
  heartbeat: 10, // default 0 (no timeout),
  persistent: true, // default true (messages will survive a broker restart event)
  queues: [ // queues to self-register with RabbitMQ on connect
    'task-queue-1',
    'task-queue-2'
  ],
  publishedEvents: [ // publish to fanout exchange
    'task-queue-3',
    'task-queue-4'
  ],
  subscribedEvents: [ // read from fanout exchanges
    'task-queue-5',
    'task-queue-6'
  ]
}).connect();

var jobCallback = function (data, done) { //data automatically decoded into object or string
  // perform operation w/ data
  done(); // remove job from RabbitMQ queue
};

/**
 * Hermes will auto-queue subscribe & publish calls if
 * connection to RabbitMQ has not yet been established
 *
 * Will throw if first argument is not a string representing
 * a valid RabbitMQ queue as defined in `queues`,
 * `publishedEvents`, or `subscribedEvents` options
 * passed to the constructor
 *
 * @param {String} queue name
 * @param {Function} queue consumer callback
 */
hermes.subscribe('valid-queue-name', jobCallback);

/**
 * Insert job into queue w/ associated job data.
 *
 * @param {String} queue name
 * @param {Object|String} task data (automatically encoded as Buffer for transmisison to RabbitMQ, will be automatically decoded in subscribe)
 */
hermes.publish('valid-queue-name', {foo: 'bar'});

/**
 * Remove bounded functions from queue events (abstracts AMQP cancel & consumerTags)
 *
 * @param {String} queue name
 * @param {Function} reference to queue consumer callback used as argument to `hermes.subscribe`
 * @param {Function} callback, invoked when queue consumer callback is no longer consuming from queue
 */
hermes.unsubscribe('valid-queue-name', jobCallback, function (err) {
  // invoked when worker removed from RabbitMQ
});
// also, you can optionally remove all workers in a queue by providing null instead of a reference to a single queue consumer callback
hermes.unsubscribe('valid-queue-name', null, function (err) {});

/**
 * Disconnecting & reconnecting
 */
hermes.close(cb);
hermes.connect(cb);

/**
 * Fetch an array of valid queues
 * @returns Array<String>
 */
var queues = hermes.getQueues();

/**
 * Hermes class extends events.EventEmitter and emits the following events:
 *   - 'publish'
 *   - 'subscribe'
 *   - 'unsubscribe'
 *   - 'error'
 *   - 'ready'
 * Examples:
 */
hermes
  .connect()
  .on('ready', function () {
  console.log('hermes connected to RabbitMQ & queues asserted');
});

hermes.on('publish', function (queueName, data) {
  console.log('hermes publish action', queueName, data);
});
hermes.publish('valid-queue-name', {foo: 'bar'});

hermes.on('subscribe', function (queueName, handlerFn) {
  // Event listener recieves queueName and reference to assigned handler function
  console.log('hermes subscribe action', queueName, handlerFn);
});
hermes.subscribe('valid-queue-name', subscribeCallback);

hermes.unsubscribe('valid-queue-name', null, unsubscribeAllCallback);
hermes.on('unsubscribe', function (queueName, handlerFn) {
  // Invoked once per task-handler callback that is unsubscribed
  // Event listener recieves queueName and reference to assigned handler function
  console.log('hermes unsubscribe action', queueName, handlerFn);
});
```

TESTS
-----
 - Tests & coverage are run using Lab
```
$ npm test
$ npm run test-cov # will auto open Google Chrome
```

LICENSE
-------
MIT
