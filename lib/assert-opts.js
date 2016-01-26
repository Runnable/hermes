/**
 * @module lib/assert-opts
 */
'use strict';

var exists = require('101/exists');
var hasKeypaths = require('101/has-keypaths');
var isString = require('101/is-string');
var isObject = require('101/is-object');

var checkQueueDef = function (queueDef) {
  if (isString(queueDef)) {
    return true
  }
  if (isObject(queueDef) && isString(queueDef.name)) {
    return true
  }
  return false
}

/**
 * Assert valid Hermes configuration options
 * @throws
 * @param {Object} opts
 */
module.exports = function (opts) {
  var requiredOpts = ['hostname', 'port', 'username', 'password', 'name'];
  if (!hasKeypaths(opts, requiredOpts)) {
    throw new Error('Hermes missing required arguments. Supplied opts '+
                    Object.keys(opts).join(', ')+
                    '. Opts must include: '+
                    requiredOpts.join(', '));
  }

  if (!exists(opts.persistent)) { opts.persistent = true; }

  // atleast one queue must be defined
  if (!exists(opts.queues) &&
      !exists(opts.publishedEvents) &&
      !exists(opts.subscribedEvents)) {
    throw new Error('Hermes requires queues, publishedEvents, ' +
      'or subscribedEvents to be defined');
  }

  // all queues must exist
  opts.queues = opts.queues || [];
  opts.publishedEvents = opts.publishedEvents || [];
  opts.subscribedEvents = opts.subscribedEvents || [];

  if (!opts.queues.every(checkQueueDef)) {
    throw new Error('Hermes option `queues` must be a flat array of strings or objects');
  }

  if (!opts.publishedEvents.every(checkQueueDef)) {
    throw new Error('Hermes option `publishedEvents` must be a flat array of strings or objects');
  }

  if (!opts.subscribedEvents.every(checkQueueDef)) {
    throw new Error('Hermes option `subscribedEvents` must be a flat array of strings or objects');
  }

  if (!isString(opts.name)) {
    throw new Error('Hermes option `name` must be a string');
  }
};
