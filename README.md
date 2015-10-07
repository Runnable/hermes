Hermes
======

Simplified abstraction interface to [amqp.node](https://github.com/squaremo/amqp.node)  

Publish & subscribe to RabbitMQ queues with simplified publish & subscribe interface
methods.  

- Connects to RabbitMQ server, establishes a channel, asserts defined queues 
  - Queues will be created as `durabale` queues, not `transient`. `persistent` messages will be saved to disk and survivie broker restarts. [Queue Durability](https://www.rabbitmq.com/tutorials/amqp-concepts.html#queue-durability)
- Autmatically buffers publish & subscribe calls until connection is established. (No need to wait for connection to be established before using `publish` or `subscribe` methods from your application.)
- Tracks references to subscribe callbacks and provides functionality to stop receiving jobs for one or all task queues. (Very similar to EventEmitter unsubscribe functionality)
- Autmatically encodes objects/strings as buffers on publish and decodes to JS Object literals for subscribe callbacks
- Provides subscribe callback with simplified `done` method to send ack message to RabbitMQ and remove tasks from queue

USAGE
-----
```js
/**
 * Hermes attempts to connect to RabbitMQ upon instantiation,
 * throws if connection fails.
 */
var hermes = require('runnable-hermes').hermesSingletonFactory({
  hostname: 'localhost',
  port: '5672',
  username: 'guest',
  password: 'guest',
  hearbeat: 10, // default 0 (no timeout),
  persistent: true, // default true (messages will survive a broker restart event)
  queues: [ // queues to self-register with RabbitMQ on connect
    'task-queue-1',
    'task-queue-2'
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
 * a valid RabbitMQ queue as defined in `queues` option
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
