/**
 * @module lib/assert-opts
 */
'use strict';

var exists = require('101/exists');
var hasKeypaths = require('101/has-keypaths');
var isString = require('101/is-string');

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

  if (!exists(opts.queues) &&
      !exists(opts.publishedEvents) &&
      !exists(opts.subscribedEvents)) {
    throw new Error('Hermes requires queues, publishedEvents, ' +
      'or subscribedEvents to be defined');
  }

  // options must exist as empty
  opts.queues = opts.queues || [];

  if (!opts.queues.every(isString)) {
    throw new Error('Hermes option `queues` must be a flat array of strings');
  }

  if (exists(opts.publishedEvents) && !opts.publishedEvents.every(isString)) {
    throw new Error('Hermes option `publishedEvents` must be a flat array of strings');
  }

  if (exists(opts.subscribedEvents) && !opts.subscribedEvents.every(isString)) {
    throw new Error('Hermes option `subscribedEvents` must be a flat array of strings');
  }

  if (!isString(opts.name)) {
    throw new Error('Hermes option `name` must be a string');
  }
};
