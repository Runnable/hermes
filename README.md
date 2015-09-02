Hermes
======

Simplified abstraction interface to [amqp.node](https://github.com/squaremo/amqp.node)  

Publish & subscribe to RabbitMQ queues with simplified publish & subscribe interface
methods.  

- Connects to RabbitMQ server, establishes a channel, asserts defined queues. 
- Autmatically buffers publish & subscribe actions until connection is established. 
No need to wait for connection to be established before using `publish` or `subscribe` methods.
- Tracks references to subscribe callbacks and provides functionality to stop receiving jobs 
for one or all task queues.
- Autmatically encodes objects/strings as buffers on publish and decodes on subscribe callbacks
- Provides subscribe callback with simplified `done` method to send ack signal to RabbitMQ

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
  hearbeat: 10, // default 0 (no timeout)
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
 * connection to RabbitMQ has not yet been established.
 * Will throw if first argument is not a string representing
 * a valid RabbitMQ queue.
 */
hermes.subscribe('valid-queue-name', jobCallback);

/**
 * Insert job into queue w/ associated job data.
 */
hermes.publish('valid-queue-name', {foo: 'bar'}); //data automatically encoded as buffer

/**
 * Remove bounded functions from queue events (abstracts AMQP cancel & consumerTags)
 */
hermes.unsubscribe('valid-queue-name', jobCallback, function (err) {
  // invoked when worker removed from RabbitMQ
});
// also, you can optionally remove all workers in a queue
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
