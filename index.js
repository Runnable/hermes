/**
 * RabbitMQ job subscribe & publish functions for Runnable
 * @module ./index
 */
'use strict';

require('loadenv')();

var EventEmitter = require('events').EventEmitter;
var amqplib = require('amqplib/callback_api');
var async = require('async');
var debug = require('debug')('hermes:index');
var hasKeypaths = require('101/has-keypaths');
var util = require('util');
var uuid = require('node-uuid');

// Temporarily hard coded
var queues = [
  'container-create'
];
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
    throw new Error('Hermes missing required arguments. Supplied opts '+
                    Object.prototype.keys(opts).join(', ')+
                    '. Opts must include: '+
                    requiredOpts.join(', '));
  }
  var _this = this;
  this._channel = null;
  this.publishQueue = [];
  this.subscribeQueue = [];
  this.consumerTags = {};
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
      async.forEach(queues, function forEachQueue (queueName, cb) {
        ch.assertQueue(queueName, {durable: true}, cb);
      }, function done (err) {
        if (err) { throw err; }
        _this._channel = ch;
        _this.emit('ready');
      });
    });
  });
  this.on('ready', function () {
    debug('hermes ready');
    var args;
    while(args = _this.publishQueue.pop()) {
      publish.apply(_this, args);
    }
    while(args = _this.subscribeQueue.pop()) {
      subscribe.apply(_this, args);
    }
  });
  this.on('publish', function (queueName, data) {
    debug('hermes publish', queueName, data);
    if (_this._channel) {
      publish(queueName, data);
    }
    else {
      _this.publishQueue.push(Array.prototype.slice.call(arguments));
    }
  });
  this.on('subscribe', function (queueName, cb) {
    debug('hermes subscribe', queueName);
    if (_this._channel) {
      subscribe(queueName, cb);
    }
    else {
      _this.subscribeQueue.push(Array.prototype.slice.call(arguments));
    }
  });
  this.on('unsubscribe', function (queueName, cb) {
    debug('hermes unsubscribe', queueName);
    if (_this._channel) {
      unsubscribe(queueName, cb);
    }
    else {
      _this.subscribeQueue.forEach(function (args) {
        /* args: [queueName, cb] */
        if (args[0] === queueName) {
          if (cb && args[1] === cb) {
            this.subscribeQueue.splice(this.subscribeQueue.indexOf(args), 1);
          }
          else {
            this.subscribeQueue.splice(this.subscribeQueue.indexOf(args), 1);
          }
        }
      });
    }
  });
  /**
   * @param {String} queueName
   * @param {Object} data
   * @return null
   */
  function publish (queueName, data) {
    debug('channel.sendToQueue', queueName, data);
    _this._channel.sendToQueue(queueName, data);
  }
  /**
   * @param {String} queueName
   * @param {Function} cb
   * @return null
   */
  function subscribe (queueName, cb) {
    debug('channel.consume', queueName);
    var consumerTag = [
      uuid.v4(),
      queueName,
      cb.name
    ].join('-');
    _this.consumerTags[consumerTag] = Array.prototype.slice.call(arguments);

    console.log('_this.consumerTags', _this.consumerTags);

    _this._channel.consume(queueName, subscribeCallback(cb), {
      consumerTag: consumerTag
    });
  }
  /**
   * @param {String} queueName
   * @param {Function} cb
   * @return null
   */
  function unsubscribe (queueName, cb) {
    debug('channel.cancel', queueName);
    var cancelTags = [];
    var tagVal;
    Object.keys(_this.consumerTags).forEach(function (consumerTag) {
      tagVal = _this.consumerTags[consumerTag];
      if (tagVal[0] === queueName) {
        if (cb && tagVal[1] === cb) {
          cancelTags.push(consumerTag);
        }
        else {
          cancelTags.push(consumerTag);
        }
      }
    });
    async.eachSeries(cancelTags, _this._channel.cancel, cb);
  }
  /**
   * @param {Function} cb
   * @return Function
   */
  function subscribeCallback (cb) {
    debug('subscribeCallback');
    return function (msg) {
      if (!msg) {
        debug('subscribeCallback invalid message', msg);
        return;
      }
      cb(JSON.parse(msg.content.toString()), function done () {
        debug('subscribeCallback done');
        _this._channel.ack(msg);
      });
    };
  }
  return this;
}

util.inherits(Hermes, EventEmitter);

/**
 * @throws
 * @param {String} queueName
 * @param {Object|String|Buffer} data
 * @return this
 */
Hermes.prototype.publish = function (queueName, data) {
  /*jshint maxcomplexity:7 */
  if (!~queues.indexOf(queueName)) {
    throw new Error('attempting to publish to invalid queue: '+queueName);
  }
  if (typeof data === 'string' || data instanceof String || data instanceof Buffer) {
    try {
      JSON.parse(data.toString());
    } catch (err) {
      throw new Error('data must be valid JSON');
    }
  }
  else {
    data = new Buffer(JSON.stringify(data));
  }
  this.emit('publish', queueName, data);
  return this;
};

/**
 * @throws
 * @param {String} queueName
 * @param {Function} cb
 * @return this
 */
Hermes.prototype.subscribe = function (queueName, cb) {
  if (!~queues.indexOf(queueName)) {
    throw new Error('attempting to subscribe to invalid queue: '+queueName);
  }
  if (cb.length !== 2) {
    throw new Error('queue listener callback must take a "done" callback function as a second'+
                    ' argument and invoke the function to send the ACK message to RabbitMQ'+
                    ' and remove the job from the queue.');
  }
  this.emit('subscribe', queueName, cb);
  return this;
};

/**
 * Unsubscribes all workers or individual worker from queue
 * @throws
 * @param {String} queueName
 * @param {Function} cb (optional)
 * @return this
 */
Hermes.prototype.unsubscribe = function (queueName, cb) {
  if (!~queues.indexOf(queueName)) {
    throw new Error('attempting to unsubscribe from invalid queue: '+queueName);
  }
  this.emit('subscribe', queueName, cb);
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
