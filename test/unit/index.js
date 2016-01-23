'use strict'

var Lab = require('lab')
var lab = exports.lab = Lab.script()
var describe = lab.describe
var it = lab.it
var afterEach = lab.afterEach
var beforeEach = lab.beforeEach
var Code = require('code')
var expect = Code.expect
var sinon = require('sinon')

var Hermes = require('../../index')
var connectionOpts = require('../fixtures/connection-opts')
var amqplib = require('amqplib/callback_api')

describe('index.js unit test', function () {
  describe('connect', function () {
    var testHermes
    beforeEach(function (done) {
      sinon.stub(amqplib, 'connect')
      sinon.stub(Hermes.prototype, '_createChannel')
      testHermes = Hermes.hermesSingletonFactory(connectionOpts.standard)
      done()
    })

    afterEach(function (done) {
      amqplib.connect.restore()
      Hermes.prototype._createChannel.restore()
      done()
    })

    it('should call _createChannel and setup error', function (done) {
      var stubOn = sinon.stub()
      amqplib.connect.yieldsAsync(null, {
        on: stubOn
      })
      Hermes.prototype._createChannel.yieldsAsync()

      testHermes.connect(function (err) {
        expect(err).to.not.exist()
        expect(Hermes.prototype._createChannel.called).to.be.true()
        expect(stubOn.withArgs('error').called).to.be.true()
        expect(testHermes._eventJobs).to.exist()
        done()
      })
    })
  }) // end connect

  describe('_createChannel', function () {
    var testHermes
    beforeEach(function (done) {
      testHermes = Hermes.hermesSingletonFactory(connectionOpts.standard)
      testHermes._connection = {
        createChannel: sinon.stub()
      }
      sinon.stub(Hermes.prototype, '_populateChannel')
      done()
    })

    afterEach(function (done) {
      Hermes.prototype._populateChannel.restore()
      done()
    })

    it('should call _populateChannel and setup error', function (done) {
      var stubOn = sinon.stub()
      testHermes._connection.createChannel.yieldsAsync(null, {
        on: stubOn
      })
      Hermes.prototype._populateChannel.yieldsAsync()

      testHermes._createChannel(function (err) {
        expect(err).to.not.exist()
        expect(Hermes.prototype._populateChannel.called).to.be.true()
        expect(stubOn.withArgs('error').called).to.be.true()
        done()
      })
    })
  }) // end _createChannel

  describe('_populateChannel', function () {
    var testHermes
    beforeEach(function (done) {
      testHermes = Hermes.hermesSingletonFactory(connectionOpts.standard)
      testHermes._channel = {
        assertQueue: sinon.stub()
      }
      testHermes._eventJobs = {
        assertAndBindQueues: sinon.stub(),
        assertExchanges: sinon.stub()
      }
      testHermes.emit = sinon.stub()
      done()
    })

    it('should add all queues and exchanges', function (done) {
      testHermes._channel.assertQueue.yieldsAsync()
      testHermes._eventJobs.assertAndBindQueues.yieldsAsync()
      testHermes._eventJobs.assertExchanges.yieldsAsync()
      testHermes.emit.returns()

      testHermes._populateChannel(function (err) {
        expect(err).to.not.exist()
        expect(testHermes._channel.assertQueue.called).to.be.true()
        expect(testHermes._eventJobs.assertAndBindQueues.called).to.be.true()
        expect(testHermes._eventJobs.assertExchanges.called).to.be.true()
        expect(testHermes.emit.withArgs('ready').called).to.be.true()
        done()
      })
    })

    it('should cb err if assertExchanges failed', function (done) {
      testHermes._channel.assertQueue.yieldsAsync()
      testHermes._eventJobs.assertExchanges.yieldsAsync()
      testHermes._eventJobs.assertAndBindQueues.yieldsAsync('err')

      testHermes._populateChannel(function (err) {
        expect(err).to.exist()
        expect(testHermes._channel.assertQueue.called).to.be.true()
        expect(testHermes._eventJobs.assertExchanges.called).to.be.true()
        expect(testHermes._eventJobs.assertAndBindQueues.called).to.be.true()
        expect(testHermes.emit.withArgs('ready').called).to.be.false()
        done()
      })
    })

    it('should cb err if assertAndBindQueues failed', function (done) {
      testHermes._channel.assertQueue.yieldsAsync()
      testHermes._eventJobs.assertExchanges.yieldsAsync('err')

      testHermes._populateChannel(function (err) {
        expect(err).to.exist()
        expect(testHermes._channel.assertQueue.called).to.be.true()
        expect(testHermes._eventJobs.assertExchanges.called).to.be.true()
        expect(testHermes._eventJobs.assertAndBindQueues.called).to.be.false()
        expect(testHermes.emit.withArgs('ready').called).to.be.false()
        done()
      })
    })

    it('should cb err if assertQueue failed', function (done) {
      testHermes._channel.assertQueue.yieldsAsync('err')

      testHermes._populateChannel(function (err) {
        expect(err).to.exist()
        expect(testHermes._channel.assertQueue.called).to.be.true()
        expect(testHermes._eventJobs.assertExchanges.called).to.be.false()
        expect(testHermes._eventJobs.assertAndBindQueues.called).to.be.false()
        expect(testHermes.emit.withArgs('ready').called).to.be.false()
        done()
      })
    })
  }) // end _populateChannel
})
