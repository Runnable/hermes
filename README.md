Hermes
======

**In time-honored Runnable tradition**:  
Hermes is second youngest of the Olympian gods. Hermes is a god of transitions
and boundaries. He is quick and cunning, and moves freely between the worlds 
of the mortal and divine, as emissary and **messenger** of the gods, intercessor 
between mortals and the divine, and conductor of souls into the afterlife. 
He is protector and patron of travelers, herdsmen, thieves, orators and wit, 
literature and poets, athletics and sports, invention and trade. In some 
myths he is a trickster, and outwits other gods for his own satisfaction or 
the sake of humankind. His attributes and symbols include the herma, the 
rooster and the tortoise, purse or pouch, winged sandals, winged cap, and his 
main symbol is the herald's staff, the Greek kerykeion or Latin caduceus which 
consisted of two snakes wrapped around a winged staff.

And so Yash doesn't lose his mind over yet another nondescriptively named repository:  
This repository orchistrates all interactions with the job queue system and 
discrete runnable application components. Interactions most comprising publishing
and subscribing to job queues. This module also simplifies interaction with RabbitMQ
and AMQP by exposing a simplified API that mimicks an event-emitter.

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
  password: 'guest'
});

var jobCallback = function (data, done) {
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
hermes.publish('valid-queue-name', {foo: 'bar'});

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
