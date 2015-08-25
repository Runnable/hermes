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
var defaults = require('101/defaults');
var hasKeypaths = require('101/has-keypaths');
var isFunction = require('101/is-function');
var isString = require('101/is-string');
var noop = require('101/noop');
var querystring = require('querystring');
var util = require('util');
var uuid = require('node-uuid');

var hermes;

/**
 * Hermes - Runnable job queue API
 * @class
 * @throws
 * @param {Object} opts
 * @param {Object} socketOpts (optional)
 * @return this
 */
function Hermes (opts, socketOpts) {
  var requiredOpts = ['hostname', 'port', 'username', 'password', 'queues'];
  if (!hasKeypaths(opts, requiredOpts)) {
    throw new Error('Hermes missing required arguments. Supplied opts '+
                    Object.keys(opts).join(', ')+
                    '. Opts must include: '+
                    requiredOpts.join(', '));
  }
  if (!Array.isArray(opts.queues) || !opts.queues.every(isString)) {
    throw new Error('Hermes option `queues` must be a flat array of strings');
  }
  this.queues = opts.queues;
  if (!socketOpts) {
    socketOpts = {};
  }
  defaults(socketOpts, {
    heartbeat: process.env.RABBITMQ_HEARTBEAT || (5 * 60) 
  });
  var _this = this;
  this._channel = null;
  this._connection = null;
  this.consumerTags = {};
  this.opts = opts;
  this.publishQueue = [];
  this.socketOpts = socketOpts;
  this.subscribeQueue = [];
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
    debug('hermes publish event', queueName, data);
    if (_this._channel) {
      publish(queueName, data);
    }
    else {
      _this.publishQueue.push(Array.prototype.slice.call(arguments));
    }
  });
  this.on('subscribe', function (queueName, cb) {
    debug('hermes subscribe event', queueName);
    if (_this._channel) {
      subscribe(queueName, cb);
    }
    else {
      _this.subscribeQueue.push(Array.prototype.slice.call(arguments));
    }
  });
  this.on('unsubscribe', function (queueName, handler, cb) {
    debug('hermes unsubscribe event', queueName);
    if (_this._channel) {
      unsubscribe(queueName, handler, cb);
    }
    else {
      _this.subscribeQueue.forEach(function (args) {
        /* args: [queueName, cb] */
        if (handler) {
          if (args[0] === queueName && args[1] === handler) {
            _this.subscribeQueue.splice(_this.subscribeQueue.indexOf(args), 1);
          }
        }
        else if (args[0] === queueName) {
          _this.subscribeQueue.splice(_this.subscribeQueue.indexOf(args), 1);
        }
      });
      cb();
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
    _this._channel.consume(queueName, subscribeCallback(cb), {
      consumerTag: consumerTag
    });
  }
  /**
   * @param {String} queueName
   * @param {Function|null} handler
   * @param {Function} cb
   * @return null
   */
  function unsubscribe (queueName, handler, cb) {
    debug('channel.cancel', queueName);
    var cancelTags = [];
    var tagVal;
    Object.keys(_this.consumerTags).forEach(function (consumerTag) {
      tagVal = _this.consumerTags[consumerTag];
      if (handler) {
        if (tagVal[0] === queueName && tagVal[1] === handler) {
          cancelTags.push(consumerTag);
        }
      }
      else if (tagVal[0] === queueName) {
        cancelTags.push(consumerTag);
      }
    });
    async.eachSeries(cancelTags, _this._channel.cancel.bind(_this._channel), function () {
      cancelTags.forEach(function (cancelTag) {
        delete _this.consumerTags[cancelTag];
      });
      if (isFunction(cb)) {
        cb.apply(_this, arguments);
      }
    });
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
  debug('hermes publish', queueName, data);
  if (!~this.queues.indexOf(queueName)) {
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
  debug('hermes subscribe', queueName);
  if (!~this.queues.indexOf(queueName)) {
    throw new Error('attempting to subscribe to invalid queue: '+queueName);
  }
  if (cb.length < 2) {
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
 * @param {Function|null} handler
 * @param {Function} cb (optional)
 * @return this
 */
Hermes.prototype.unsubscribe = function (queueName, handler, cb) {
  debug('hermes unsubscribe', queueName);
  if (!~this.queues.indexOf(queueName)) {
    throw new Error('attempting to unsubscribe from invalid queue: '+queueName);
  }
  this.emit('unsubscribe', queueName, handler, cb);
  return this;
};

/**
 * Connect
 * @param {Function} cb (optional)
 * @return this
 */
Hermes.prototype.connect = function (cb) {
  cb = cb || noop;
  var _this = this;
  var connectionUrl = [
    'amqp://', this.opts.username, ':', this.opts.password,
    '@', this.opts.hostname];
  if (this.opts.port) {
    // optional port
    connectionUrl.push(':');
    connectionUrl.push(this.opts.port);
  }
  connectionUrl = [
    connectionUrl.join(''),
    '?',
    querystring.stringify(this.socketOpts)
  ].join('');
  debug('connectionUrl', connectionUrl);
  debug('socketOpts', this.socketOpts);
  amqplib.connect(connectionUrl, this.socketOpts, function (err, conn) {
    if (err) { return cb(err); }
    debug('rabbitmq connected');
    _this._connection = conn;
    conn.createChannel(function (err, ch) {
      if (err) { return cb(err); }
      debug('rabbitmq channel created');
      /**
       * Durable queue: https://www.rabbitmq.com/tutorials/tutorial-two-python.html
       * (Message Durability)
       */
      async.forEach(_this.queues, function forEachQueue (queueName, cb) {
        ch.assertQueue(queueName, {durable: true}, cb);
      }, function done (err) {
        if (err) { return cb(err); }
        _this._channel = ch;
        _this.emit('ready');
        cb();
      });
    });
  });
  return this;
};

/**
 * Disconnect
 * @param {Function} cb
 * @return this
 */
Hermes.prototype.close = function (cb) {
  debug('hermes close');
  var _this = this;
  async.series([
    function (cb) {
      if (!_this._channel) {
        debug('hermes close !channel');
        return cb();
      }
      _this._channel.close(function (err) {
        debug('hermes channel close', arguments);
        if (!err) {
          delete _this._channel;
        }
        cb.apply(this, arguments);
      });
    },
    function (cb) {
      if (!_this._connection) {
        debug('hermes connection !connection');
        return cb();
      }
      _this._connection.close(function (err) {
        debug('hermes connection close', arguments);
        if (!err) {
          delete _this._channel;
          delete _this._connection;
        }
        cb.apply(this, arguments);
      });
    }
  ], cb);

  return this;
};

/**
 * Factory method takes configuration once during applicaiton lifecycle and
 * returns instance of hermes
 */
module.exports.hermesSingletonFactory = function (opts, socketOpts) {
  debug('hermesSingletonFactory', opts, socketOpts);
  hermes = (hermes) ? hermes : new Hermes(opts, socketOpts);
  return hermes;
};
