'use strict';

module.exports = Events;

var async = require('async');
var debug = require('debug')('hermes:lib:events');
var isFunction = require('101/is-function');

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
function Events (opts) {
  debug('Events constructor');
  this._publishedEvents = opts.publishedEvents || [];
  this._subscribedEvents = opts.subscribedEvents || [];
  this.name = opts.name || '';
  this._channel = opts.channel;
  if (!this._channel) {
    throw new Error('channel required');
  }
}

/**
 * checks to see if event is a publish event
 * @param  {String}  name name of queue to publish to
 */
Events.prototype._isPublishEvent = function (name) {
  debug('_isPublishEvent', name);
  return ~this._publishedEvents.indexOf(name);
};

/**
 * used to publish events to a certain exchange
 * do nothing if event is not one defined in _publishedEvents
 * @see http://www.squaremobius.net/amqp.node/channel_api.html#channel_publish
 * @param  {String}   event name of exchange to publish too
 * @param  {Object}   data      job data
 */
Events.prototype.publishEvent = function (event, data) {
  debug('publishEvent', event, data);
  if (!this._isPublishEvent(event)) { return; }
  this._channel.publish(event, '', data);
};

/**
 * creates an exchange for each events we want to publish
 * @see http://www.squaremobius.net/amqp.node/channel_api.html#channel_assertExchange
 * @param  {Function} cb (err)
 */
Events.prototype.createExchanges = function (cb) {
  debug('createExchanges');
  var self = this;

  async.forEach(this._publishedEvents, function (exchangeName, forEachCb) {
    self._channel.assertExchange(exchangeName, 'fanout', { durable: true }, forEachCb);
  }, cb);
};

/**
 * checks to see if event is part of _subscribedEvents
 * @param  {String}  name name of queue to publish to
 */
Events.prototype._isSubscribeEvent = function (name) {
  debug('_isSubscribeEvent', name);
  return ~this._subscribedEvents.indexOf(name);
};

/**
 * setup queues with the handlers passed in
 * @param  {Function} cb (err)
 */
Events.prototype.createQueues = function (cb) {
  debug('createQueues');
  var self = this;

  async.forEach(Object.keys(this._subscribedEvents), function (event, forEachCb) {
    if (!isFunction(this._subscribedEvents[event])) {
      throw new Events('missing handler for event ' + event);
    }

    self._createQueue(event, forEachCb);
  }, cb);
};

/**
 * asserts a queue and then binds that to the event exchange
 * appends name to queue to have a predictable queue name
 * @see http://www.squaremobius.net/amqp.node/channel_api.html#channel_assertQueue
 * @see http://www.squaremobius.net/amqp.node/channel_api.html#channel_bindQueue
 * @param  {String}   event name to event to create queue for
 * @param  {Function} cb    (err)
 */
Events.prototype._createQueue = function (event, cb) {
  debug('_createQueue', event);
  var self = this;

  var queueName = self.name + event + 'queue';
  self._channel.assertQueue(queueName, { durable: true, }, function (err1) {
    if (err1) { return cb(err1); }

    self._channel.bindQueue(queueName, event, '', function (err2) {
      if (err2) { return cb(err2); }

      self._consumeQueue(queueName, event);
    });
  });
};

/**
 * start consuming events and calling event handlers
 * @see http://www.squaremobius.net/amqp.node/channel_api.html#channel_consume
 * do nothing if event is not one defined in _publishedEvents
 * @param  {String} queue name of queue to consume
 * @param  {String} event name of event attached to queue
 */
Events.prototype.subscribe = function (event, cb) {
  debug('subscribe', event);
  if (!this._isSubscribeEvent(event)) { return; }
  var queueName = this.name + event + 'queue';

  this._channel.consume(queueName, cb);
};
