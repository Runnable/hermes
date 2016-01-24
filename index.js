/**
 * RabbitMQ job subscribe & publish functions for Runnable
 * @module ./index
 */
'use strict'

require('loadenv')()

var EventEmitter = require('events').EventEmitter
var amqplib = require('amqplib/callback_api')
var async = require('async')
var debug = require('debug')('hermes:index')
var defaults = require('101/defaults')
var isFunction = require('101/is-function')
var noop = require('101/noop')
var querystring = require('querystring')
var util = require('util')
var uuid = require('node-uuid')

var assertOpts = require('./lib/assert-opts')
var EventJobs = require('./lib/event-jobs')

var hermes

/**
 * Hermes - Runnable job queue API
 * @class
 * @throws
 * @param {Object} opts
 * @param {Object} socketOpts (optional)
 * @return this
 */
function Hermes (opts, socketOpts) {
  // mutates opts
  assertOpts(opts)
  if (!socketOpts) { socketOpts = {} }
  defaults(socketOpts, {
    heartbeat: 0
  })
  var self = this
  this._channel = null
  this._connection = null
  this._consumerTags = {}
  this._opts = opts
  this._publishQueue = []
  this._socketOpts = socketOpts
  this._subscribeQueue = []

  this._eventJobs = new EventJobs({
    publishedEvents: this._opts.publishedEvents,
    subscribedEvents: this._opts.subscribedEvents,
    name: this._opts.name
  })

  this.on('ready', function () {
    debug('hermes ready')
    var args = self._publishQueue.pop()
    while (args) {
      publish.apply(self, args)
      args = self._publishQueue.pop()
    }
    args = self._subscribeQueue.pop()
    while (args) {
      subscribe.apply(self, args)
      args = self._subscribeQueue.pop()
    }
  })
  this.on('publish', function (queueName, data) {
    debug('hermes publish event', queueName, data)
    if (self._channel) {
      publish(queueName, data)
    } else {
      self._publishQueue.push(Array.prototype.slice.call(arguments))
    }
  })
  this.on('subscribe', function (queueName, cb) {
    debug('hermes subscribe event', queueName)
    if (self._channel) {
      subscribe(queueName, cb)
    } else {
      self._subscribeQueue.push(Array.prototype.slice.call(arguments))
    }
  })
  this.on('unsubscribe', function (queueName, handler, cb) {
    debug('hermes unsubscribe event', queueName)
    if (self._channel) {
      unsubscribe(queueName, handler, cb)
    } else {
      self._subscribeQueue.forEach(function (args) {
        /* args: [queueName, cb] */
        if (handler) {
          if (args[0] === queueName && args[1] === handler) {
            self._subscribeQueue.splice(self._subscribeQueue.indexOf(args), 1)
          }
        } else if (args[0] === queueName) {
          self._subscribeQueue.splice(self._subscribeQueue.indexOf(args), 1)
        }
      })
      cb()
    }
  })
  /**
   * @param {String} queueName
   * @param {Object} data
   * @return null
   */
  function publish (queueName, data) {
    debug('channel.sendToQueue', queueName, data)

    if (self._eventJobs.isPublishEvent(queueName)) {
      return self._eventJobs.publish(queueName, data)
    }

    self._channel.sendToQueue(
      queueName, data, { persistent: self._opts.persistent })
  }
  /**
   * @param {String} queueName
   * @param {Function} cb
   * @return null
   */
  function subscribe (queueName, cb) {
    debug('channel.consume', queueName)
    var consumerTag = [
      uuid.v4(),
      queueName,
      cb.name
    ].join('-')
    self._consumerTags[consumerTag] = Array.prototype.slice.call(arguments)

    if (self._eventJobs.isSubscribeEvent(queueName)) {
      return self._eventJobs.subscribe(queueName, self._subscribeCallback(cb))
    }

    self._channel.consume(queueName, self._subscribeCallback(cb), {
      consumerTag: consumerTag
    })
  }
  /**
   * @param {String} queueName
   * @param {Function|null} handler
   * @param {Function} cb
   * @return null
   */
  function unsubscribe (queueName, handler, cb) {
    debug('channel.cancel', queueName)
    var cancelTags = []
    var tagVal
    Object.keys(self._consumerTags).forEach(function (consumerTag) {
      tagVal = self._consumerTags[consumerTag]
      if (handler) {
        if (tagVal[0] === queueName && tagVal[1] === handler) {
          cancelTags.push(consumerTag)
        }
      } else if (tagVal[0] === queueName) {
        cancelTags.push(consumerTag)
      }
    })
    async.eachSeries(cancelTags, self._channel.cancel.bind(self._channel), function () {
      cancelTags.forEach(function (cancelTag) {
        delete self._consumerTags[cancelTag]
      })
      if (isFunction(cb)) {
        cb.apply(self, arguments)
      }
    })
  }
  return this
}

util.inherits(Hermes, EventEmitter)

/**
 * Factory method of accessing the module level hermes singelton.
 * @param {object} opts Options for the hermes client.
 * @param {object} socketOpts Options for the underlying amqp socket.
 */
Hermes.hermesSingletonFactory = function (opts, socketOpts) {
  debug('hermesSingletonFactory', opts, socketOpts)
  hermes = hermes || new Hermes(opts, socketOpts)
  return hermes
}

/**
 * Hermes amqp interface module.
 * @module hermes
 */
module.exports = Hermes

/**
 * Returns all the queues with which Hermes was created.
 * @return {Array<String>} Queue names
 */
Hermes.prototype.getQueues = function () {
  return this._opts.queues.slice().concat(
    this._opts.publishedEvents.slice(),
    this._opts.subscribedEvents.slice())
}

/**
 * @throws
 * @param {String} queueName
 * @param {Object|String|Buffer} data
 * @return this
 */
Hermes.prototype.publish = function (queueName, data) {
  debug('hermes publish', queueName, data)
  if (!~this._opts.queues.indexOf(queueName) && !this._eventJobs.isPublishEvent(queueName)) {
    throw new Error('attempting to publish to invalid queue: ' + queueName)
  }
  if (typeof data === 'string' || data instanceof String || data instanceof Buffer) {
    try {
      JSON.parse(data.toString())
    } catch (err) {
      throw new Error('data must be valid JSON')
    }
  } else {
    data = new Buffer(JSON.stringify(data))
  }
  this.emit('publish', queueName, data)
  return this
}

/**
 * @throws
 * @param {String} queueName
 * @param {Function} cb
 * @return this
 */
Hermes.prototype.subscribe = function (queueName, handler) {
  debug('hermes subscribe', queueName)
  if (!~this._opts.queues.indexOf(queueName) && !this._eventJobs.isSubscribeEvent(queueName)) {
    throw new Error('attempting to subscribe to invalid queue: ' + queueName)
  }
  if (handler.length < 2) {
    throw new Error('queue listener callback must take a "done" callback function as a second' +
      ' argument and invoke the function to send the ACK message to RabbitMQ' +
      ' and remove the job from the queue.')
  }
  this.emit('subscribe', queueName, handler)
  return this
}

/**
 * Unsubscribes all workers or individual worker from queue
 * @throws
 * @param {String} queueName
 * @param {Function|null} handler
 * @param {Function} cb (optional)
 * @return this
 */
Hermes.prototype.unsubscribe = function (queueName, handler, cb) {
  debug('hermes unsubscribe', queueName)
  if (!~this._opts.queues.indexOf(queueName) && !this._eventJobs.isSubscribeEvent(queueName)) {
    throw new Error('attempting to unsubscribe from invalid queue: ' + queueName)
  }
  this.emit('unsubscribe', queueName, handler, cb)
  return this
}

/**
 * Connect
 * @param {Function} cb (optional)
 * @return this
 */
Hermes.prototype.connect = function (cb) {
  cb = cb || noop
  var self = this
  var connectionUrl = [
    'amqp://', this._opts.username, ':', this._opts.password,
    '@', this._opts.hostname]
  if (this._opts.port) {
    // optional port
    connectionUrl.push(':')
    connectionUrl.push(this._opts.port)
  }
  connectionUrl = [
    connectionUrl.join(''),
    '?',
    querystring.stringify(this._socketOpts)
  ].join('')

  debug('connectionUrl', connectionUrl)
  debug('socketOpts', this._socketOpts)

  amqplib.connect(connectionUrl, this._socketOpts, function (err, conn) {
    if (err) { return cb(err) }
    debug('rabbitmq connected')
    self._connection = conn
    // we need listen to the `error` otherwise it would be thrown
    self._connection.on('error', function (err) {
      err = err || new Error('Connection error')
      err.reason = 'connection error'
      self.emit('error', err)
    })

    self._createChannel(cb)
  })
  return this
}

/**
 * responsible for creating a channel
 * should also initialize all queue modules
 * @param  {Function} cb (err)
 */
Hermes.prototype._createChannel = function (cb) {
  var self = this

  self._connection.createChannel(function (err, ch) {
    if (err) { return cb(err) }
    debug('rabbitmq channel created')
    /**
     * Durable queue: https://www.rabbitmq.com/tutorials/tutorial-two-python.html
     * (Message Durability)
     */
    self._channel = ch
    if (self._opts.prefetch) {
      self._channel.prefetch(self._opts.prefetch)
    }

    self._eventJobs.setChannel(ch)
    // we need listen to the `error` otherwise it would be thrown
    self._channel.on('error', function (err) {
      err = err || new Error('Channel error')
      err.reason = 'channel error'
      self.emit('error', err)
    })

    self._populateChannel(cb)
  })
}

/**
 * responsible for populating the channel with queues and exchanges
 * @param  {Function} cb (err)
 */
Hermes.prototype._populateChannel = function (cb) {
  var self = this

  async.forEach(self._opts.queues, function forEachQueue (queueName, forEachCb) {
    var opts = {
      durable: true
    }
    if (process.env.HERMES_QUEUE_EXPIRES) {
      opts.expires = process.env.HERMES_QUEUE_EXPIRES
    }
    self._channel.assertQueue(queueName, opts, forEachCb)
  }, function done (err) {
    if (err) { return cb(err) }

    self._eventJobs.assertExchanges(function (err) {
      if (err) { return cb(err) }

      self._eventJobs.assertAndBindQueues(function (err) {
        if (err) { return cb(err) }
        self.emit('ready')
        cb()
      })
    })
  })
}

/**
 * Disconnect
 * @param {Function} cb
 * @return this
 */
Hermes.prototype.close = function (cb) {
  debug('hermes close')
  var self = this
  async.series([
    function (stepCb) {
      if (!self._channel) {
        debug('hermes close !channel')
        return stepCb()
      }
      self._channel.close(function (err) {
        debug('hermes channel close', arguments)
        if (!err) {
          delete self._channel
        }
        stepCb.apply(this, arguments)
      })
    },
    function (stepCb) {
      if (!self._connection) {
        debug('hermes connection !connection')
        return stepCb()
      }
      self._connection.close(function (err) {
        debug('hermes connection close', arguments)
        if (!err) {
          delete self._channel
          delete self._connection
        }
        stepCb.apply(this, arguments)
      })
    }
  ], cb)

  return this
}

/**
 * @param {Function} cb
 * @return Function
 */
Hermes.prototype._subscribeCallback = function (cb) {
  var self = this
  debug('_subscribeCallback')
  return function (msg) {
    if (!msg) {
      debug('_subscribeCallback invalid message', msg)
      return
    }
    cb(JSON.parse(msg.content.toString()), function done () {
      if (self._channel) {
        debug('_subscribeCallback done')
        self._channel.ack(msg)
      } else {
        debug('_subscribeCallback cannot ack. channel does not exist')
        self.emit('error', new Error('Cannot ack. Channel does not exist'))
      }
    })
  }
}
