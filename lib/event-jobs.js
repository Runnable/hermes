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
  this._name = opts.name || '';
  this._channel = opts.channel;
  if (!this._channel) {
    debug('error: channel required');
    throw new Error('channel required');
  }
}

/**
 * checks to see if event is a publish event
 * @param  {String}  name name of queue to publish to
 */
EventJobs.prototype.isPublishEvent = function (name) {
  debug('isPublishEvent', name);
  return ~this._publishedEvents.indexOf(name);
};

/**
 * creates an exchanges for each events we want to publish
 * @param  {Function} cb (err)
 */
EventJobs.prototype.createExchanges = function (cb) {
  debug('createExchanges');
  async.forEach(this._publishedEvents, this._createExchange, cb);
};

/**
 * creates an exchange
 * @see http://www.squaremobius.net/amqp.node/channel_api.html#channel_assertExchange
 * @param  {Function} cb (err)
 */
EventJobs.prototype._createExchange = function (exchangeName, cb) {
  debug('_createExchange', exchangeName);
  this._channel.assertExchange(exchangeName, 'fanout', { durable: true }, cb);
};

/**
 * used to publish events to a certain exchange
 * do nothing if event is not one defined in _publishedEvents
 * @see http://www.squaremobius.net/amqp.node/channel_api.html#channel_publish
 * @param  {String}   event name of exchange to publish too
 * @param  {Object}   data      job data
 */
EventJobs.prototype.publish = function (event, data) {
  debug('publish', event, data);
  this._channel.publish(event, '', data);
};

/**
 * checks to see if event is part of _subscribedEvents
 * @param  {String}  name name of queue to publish to
 */
EventJobs.prototype.isSubscribeEvent = function (name) {
  debug('isSubscribeEvent', name);
  return ~this._subscribedEvents.indexOf(name);
};

/**
 * setup queues passed for each event we want to listen for
 * @param  {Function} cb (err)
 */
EventJobs.prototype.createQueues = function (cb) {
  debug('createQueues');
  async.forEach(this._subscribedEvents, this._createQueue, cb);
};

/**
 * asserts a queue and then binds that to the event exchange
 * appends name to queue to have a predictable queue name
 * @see http://www.squaremobius.net/amqp.node/channel_api.html#channel_assertQueue
 * @see http://www.squaremobius.net/amqp.node/channel_api.html#channel_bindQueue
 * @param  {String}   event name to event to create queue for
 * @param  {Function} cb    (err)
 */
EventJobs.prototype._createQueue = function (event, cb) {
  debug('_createQueue', event);
  var self = this;

  var queueName = self._name + event + 'queue';
  self._channel.assertQueue(queueName, { durable: true }, function (err) {
    if (err) { return cb(err); }

    self._channel.bindQueue(queueName, event, '', cb);
  });
};

/**
 * start consuming events and calling event handlers
 * @see http://www.squaremobius.net/amqp.node/channel_api.html#channel_consume
 * do nothing if event is not one defined in _publishedEvents
 * @param  {String} queue name of queue to consume
 * @param  {String} event name of event attached to queue
 */
EventJobs.prototype.subscribe = function (event, cb) {
  debug('subscribe', event);
  var queueName = this._name + event + 'queue';

  this._channel.consume(queueName, cb);
};
