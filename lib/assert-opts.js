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
  var requiredOpts = ['hostname', 'port', 'username', 'password', 'queues'];
  if (!hasKeypaths(opts, requiredOpts)) {
    throw new Error('Hermes missing required arguments. Supplied opts '+
                    Object.keys(opts).join(', ')+
                    '. Opts must include: '+
                    requiredOpts.join(', '));
  }
  if (!exists(opts.persistent)) { opts.persistent = true; }
  if (!Array.isArray(opts.queues) || !opts.queues.every(isString)) {
    throw new Error('Hermes option `queues` must be a flat array of strings');
  }
};
