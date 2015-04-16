/**
 * RabbitMQ job subscribe & publish functions for Runnable
 * @module ./index
 */
'use strict';

require('loadenv')();

var EventEmitter = require('events').EventEmitter;
var amqplib = require('amqplib');
var hasKeypaths = require('101/has-keypaths');
var util = require('util');

var queueName = process.env.QUEUE_NAME;

/**
 * Hermes - Runnable job queue API
 * @class
 * @throws
 * @param {Object} opts
 * @return this
 */
function Hermes (opts) {
  var requiredOpts = ['hostname', 'port', 'username', 'password'];
  if (!hasKeypaths(opts, requiredOpts)) {
    throw new Error('Hermes missing required arguments. Opts  must '+
                    'include: '+requiredOpts.join(', '));
  }

  var _this = this;
  this.channel = null;
  this.publishQueue = [];
  this.subscribeQueue = [];

  var connectionUrl = [
    'amqp://', opts.username, ':', opts.password,
    '@', opts.hostname, ':', opts.port].join('');
  amqplib.connect(connectionUrl, function (err, conn) {
    if (err) { throw err; }
    conn.createChannel(function (err, ch) {
      if (err) { throw err; }
      ch.assertQueue(queueName);
      _this.channel = ch;
      _this.emit('connected');
    });
  });

  this.on('connected', function () {
    this.queue.map(publish, _this);
  });

  this.on('publish', function (data) {
    if (_this.channel) {
      publish(data);
    }
    else {
      _this.publishQueue.push(data);
    }
  });

  this.on('subscribe', function (data) {
    if (_this.channel) {
      subscribe(data);
    }
    else {
      _this.subscribeQueue.push(data);
    }
  });

  /**
   * @param {Object} data
   * @return null
   */
  function publish (data) {
    _this.channel.sendToQueue(queueName, data);
  }

  /**
   * @param {Object} data
   * @return null
   */
  function subscribe (cb) {
    _this.channel.consume(queueName, cb);
  }

  return this;
}

util.inherits(Hermes, EventEmitter);

/**
 * @param {Object} data
 * @return this
 */
Hermes.prototype.publish = function (data) {
  this.emit('publish', data);
  return this;
};

/**
 * @param {Object} data
 * @return this
 */
Hermes.prototype.subscribe = function (data) {
  this.emit('subscribe', data);
  return this;
};

module.exports = Hermes;
