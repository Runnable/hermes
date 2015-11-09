'use strict';

module.exports = EventJobs;

var async = require('async');
var debug = require('debug')('hermes:lib:events');

/**
 * Used to handle all event operations
 * @param {Object} opts options
 * @param opts.publishedEvents array of strings of events
 *          which are going to be published to
 * @param opts.subscribedEvents array of strings of events
 *          which are going to be subscribed to
 * @param opts.name name of service
 * @param opts.channel rabbitmq connection channel
 */
function EventJobs (opts) {
  debug('EventJobs constructor');
  this._publishedEvents = opts.publishedEvents || [];
  this._subscribedEvents = opts.subscribedEvents || [];

  this._name = opts.name;
  if (!this._name) {
    debug('error: name required for EventJobs');
    throw new Error('name required for EventJobs');
  }

  this._channel = opts.channel;
  if (!this._channel) {
    debug('error: channel required for EventJobs');
    throw new Error('channel required for EventJobs');
  }
}

/**
 * checks to see if event is a publish event
 * @param  {String}  eventName name of exchange to publish to
 */
EventJobs.prototype.isPublishEvent = function (eventName) {
  debug('isPublishEvent', eventName);
  return ~this._publishedEvents.indexOf(eventName);
};

/**
 * creates an exchanges for each events we want to publish
 * @param  {Function} cb (err)
 */
EventJobs.prototype.assertExchanges = function (cb) {
  debug('assertExchanges');
  async.forEach(this._publishedEvents, this._assertExchange.bind(this), cb);
};

/**
 * creates an exchange
 * @see http://www.squaremobius.net/amqp.node/channel_api.html#channel_assertExchange
 * @param  {Function} cb (err)
 */
EventJobs.prototype._assertExchange = function (exchangeName, cb) {
  debug('_assertExchange', exchangeName);
  this._channel.assertExchange(exchangeName, 'fanout', { durable: true }, cb);
};

/**
 * used to publish events to a certain exchange
 * do nothing if event is not one defined in _publishedEvents
 * @see http://www.squaremobius.net/amqp.node/channel_api.html#channel_publish
 * @param  {String}   eventName name of exchange to publish too
 * @param  {Object}   data      job data
 */
EventJobs.prototype.publish = function (eventName, data) {
  debug('publish', eventName, data);
  this._channel.publish(eventName, '', data);
};

/**
 * checks to see if event is part of _subscribedEvents
 * @param  {String}  eventName name of queue to subscribe to
 */
EventJobs.prototype.isSubscribeEvent = function (eventName) {
  debug('isSubscribeEvent', eventName);
  return ~this._subscribedEvents.indexOf(eventName);
};

/**
 * setup queues passed for each event we want to listen for
 * @param  {Function} cb (err)
 */
EventJobs.prototype._assertAndBindQueues = function (cb) {
  debug('_assertAndBindQueues');
  async.forEach(this._subscribedEvents, this._assertAndBindQueue.bind(this), cb);
};

/**
 * asserts a queue and then binds that to the event exchange
 * appends name to queue to have a predictable queue name
 * @see http://www.squaremobius.net/amqp.node/channel_api.html#channel_assertQueue
 * @see http://www.squaremobius.net/amqp.node/channel_api.html#channel_bindQueue
 * @param  {String}   eventName name to create queue for
 * @param  {Function} cb    (err)
 */
EventJobs.prototype._assertAndBindQueue = function (eventName, cb) {
  debug('_assertAndBindQueue', eventName);
  var self = this;

  var queueName = [self._name, eventName].join('.');
  self._channel.assertQueue(queueName, { durable: true }, function (err) {
    if (err) { return cb(err); }

    self._channel.bindQueue(queueName, eventName, '', {}, cb);
  });
};

/**
 * start consuming events and calling event handlers
 * @see http://www.squaremobius.net/amqp.node/channel_api.html#channel_consume
 * do nothing if event is not one defined in _publishedEvents
 * @param  {String} queue name of queue to consume
 * @param  {String} eventName name of event attached to queue
 */
EventJobs.prototype.subscribe = function (eventName, cb) {
  debug('subscribe', eventName);
  var queueName = [this._name, eventName].join('.');
  this._channel.consume(queueName, cb);
};
