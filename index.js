/**
 * RabbitMQ job subscribe & publish functions for Runnable
 * @module ./index
 */
'use strict';

require('loadenv')();

var EventEmitter = require('events').EventEmitter;
var amqplib = require('amqplib');
var debug = require('debug')('hermes:index');
var hasKeypaths = require('101/has-keypaths');
var util = require('util');

var generalQueueName = 'general';
var hermes;

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
    '@', opts.hostname];
  if (opts.port) {
    // optional port
    connectionUrl.push(':');
    connectionUrl.push(opts.port);
  }
  connectionUrl = connectionUrl.join('');
  debug('connectionUrl', connectionUrl);
  amqplib.connect(connectionUrl, function (err, conn) {
    if (err) { throw err; }
    debug('rabbitmq connected');
    conn.createChannel(function (err, ch) {
      if (err) { throw err; }
      debug('rabbitmq channel created');
      /**
       * Durable queue: https://www.rabbitmq.com/tutorials/tutorial-two-python.html
       * (Message Durability)
       */
      ch.assertQueue(generalQueueName, {durable: true}, function (err) {
        if (err) { throw err; }
        debug('rabbitmq queue: "'+generalQueueName+'" created');
        _this.channel = ch;
        _this.emit('ready');
      });
    });
  });
  this.on('ready', function () {
    debug('hermes ready');
    this.queue.map(publish, _this);
  });
  this.on('publish', function (data) {
    debug('hermes publish', data);
    if (_this.channel) {
      publish(data);
    }
    else {
      _this.publishQueue.push(data);
    }
  });
  this.on('subscribe', function (data) {
    debug('hermes subscribe', data);
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
    _this.channel.sendToQueue(generalQueueName, data);
  }
  /**
   * @param {Object} data
   * @return null
   */
  function subscribe (cb) {
    _this.channel.consume(generalQueueName, cb);
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

/**
 * Factory method takes configuration once during applicaiton lifecycle and
 * returns instance of hermes
 */
module.exports.hermesSingletonFactory = function (opts) {
  hermes = (hermes) ? hermes : new Hermes(opts);
  return hermes;
};
