'use strict';

var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var afterEach = lab.afterEach;
var beforeEach = lab.beforeEach;
var Code = require('code');
var expect = Code.expect;
var sinon = require('sinon');

var Hermes = require('../../index');
var connectionOpts = require('../fixtures/connection-opts');
var amqplib = require('amqplib/callback_api');

describe('index.js unit test', function () {
  describe('connect', function () {
    var testHermes;
    beforeEach(function (done) {
      sinon.stub(amqplib, 'connect');
      sinon.stub(Hermes.prototype, '_createChannel');
      testHermes = Hermes.hermesSingletonFactory(connectionOpts.standard);
      done();
    });

    afterEach(function (done) {
      amqplib.connect.restore();
      Hermes.prototype._createChannel.restore();
      done();
    });

    it('should call _createChannel and setup error', function (done) {
      var stubOn = sinon.stub();
      amqplib.connect.yieldsAsync(null, {
        on: stubOn
      });
      Hermes.prototype._createChannel.yieldsAsync();

      testHermes.connect(function (err) {
        expect(err).to.not.exist();
        expect(Hermes.prototype._createChannel.called).to.be.true();
        expect(stubOn.withArgs('error').called).to.be.true();
        expect(testHermes._eventJobs).to.exist();
        done();
      });
    });
  }); // end connect

  describe('_createChannel', function () {
    var testHermes;
    beforeEach(function (done) {
      testHermes = Hermes.hermesSingletonFactory(connectionOpts.standard);
      testHermes._connection = {
        createChannel: sinon.stub()
      };
      sinon.stub(Hermes.prototype, '_populateChannel');
      done();
    });

    afterEach(function (done) {
      Hermes.prototype._populateChannel.restore();
      done();
    });

    it('should call _populateChannel and setup error', function (done) {
      var stubOn = sinon.stub();
      testHermes._connection.createChannel.yieldsAsync(null, {
        on: stubOn
      });
      Hermes.prototype._populateChannel.yieldsAsync();

      testHermes._createChannel(function (err) {
        expect(err).to.not.exist();
        expect(Hermes.prototype._populateChannel.called).to.be.true();
        expect(stubOn.withArgs('error').called).to.be.true();
        done();
      });
    });
  }); // end _createChannel

  describe('_assertQueue', function () {
    var testHermes;
    beforeEach(function (done) {
      testHermes = Hermes.hermesSingletonFactory(connectionOpts.standard)
      testHermes._channel = {
        assertQueue: function () {}
      }
      sinon.stub(testHermes._channel, 'assertQueue').yieldsAsync()
      done()
    })

    it('should work when queueDef was passed', function (done) {
      var queDef = {
        name: 'expiring-queue',
        opts: {
          expires: 10
        }
      }
      testHermes._assertQueue(queDef, function (err) {
        expect(err).to.not.exist()
        sinon.assert.calledOnce(testHermes._channel.assertQueue)
        sinon.assert.calledWith(
          testHermes._channel.assertQueue,
          'expiring-queue',
          { expires: 10 },
          sinon.match.func)
        done()
      })
    })

    it('should be able to override durable param', function (done) {
      var queDef = {
        name: 'expiring-queue',
        opts: {
          expires: 10,
          durable: false
        }
      }
      testHermes._assertQueue(queDef, function (err) {
        expect(err).to.not.exist()
        sinon.assert.calledOnce(testHermes._channel.assertQueue)
        sinon.assert.calledWith(
          testHermes._channel.assertQueue,
          'expiring-queue',
          { durable: false, expires: 10 },
          sinon.match.func)
        done()
      })
    })
  })

  describe('_populateChannel', function () {
    var testHermes;
    beforeEach(function (done) {
      testHermes = Hermes.hermesSingletonFactory(connectionOpts.standard);
      testHermes._channel = {
        assertQueue: sinon.stub()
      };
      testHermes._eventJobs = {
        assertAndBindQueues: sinon.stub(),
        assertExchanges: sinon.stub()
      };
      testHermes.emit = sinon.stub();
      done();
    });

    it('should add all queues and exchanges', function (done) {
      testHermes._channel.assertQueue.yieldsAsync();
      testHermes._eventJobs.assertAndBindQueues.yieldsAsync();
      testHermes._eventJobs.assertExchanges.yieldsAsync();
      testHermes.emit.returns();

      testHermes._populateChannel(function (err) {
        expect(err).to.not.exist();
        expect(testHermes._channel.assertQueue.called).to.be.true();
        expect(testHermes._eventJobs.assertAndBindQueues.called).to.be.true();
        expect(testHermes._eventJobs.assertExchanges.called).to.be.true();
        expect(testHermes.emit.withArgs('ready').called).to.be.true();
        done();
      });
    });

    it('should cb err if assertExchanges failed', function (done) {
      testHermes._channel.assertQueue.yieldsAsync();
      testHermes._eventJobs.assertExchanges.yieldsAsync();
      testHermes._eventJobs.assertAndBindQueues.yieldsAsync('err');

      testHermes._populateChannel(function (err) {
        expect(err).to.exist();
        expect(testHermes._channel.assertQueue.called).to.be.true();
        expect(testHermes._eventJobs.assertExchanges.called).to.be.true();
        expect(testHermes._eventJobs.assertAndBindQueues.called).to.be.true();
        expect(testHermes.emit.withArgs('ready').called).to.be.false();
        done();
      });
    });

    it('should cb err if assertAndBindQueues failed', function (done) {
      testHermes._channel.assertQueue.yieldsAsync();
      testHermes._eventJobs.assertExchanges.yieldsAsync('err');

      testHermes._populateChannel(function (err) {
        expect(err).to.exist();
        expect(testHermes._channel.assertQueue.called).to.be.true();
        expect(testHermes._eventJobs.assertExchanges.called).to.be.true();
        expect(testHermes._eventJobs.assertAndBindQueues.called).to.be.false();
        expect(testHermes.emit.withArgs('ready').called).to.be.false();
        done();
      });
    });

    it('should cb err if assertQueue failed', function (done) {
      testHermes._channel.assertQueue.yieldsAsync('err');

      testHermes._populateChannel(function (err) {
        expect(err).to.exist();
        expect(testHermes._channel.assertQueue.called).to.be.true();
        expect(testHermes._eventJobs.assertExchanges.called).to.be.false();
        expect(testHermes._eventJobs.assertAndBindQueues.called).to.be.false();
        expect(testHermes.emit.withArgs('ready').called).to.be.false();
        done();
      });
    });
  }); // end _populateChannel
  describe('_normalizeQueue', function () {
    it('should return queueDef if name is provided', function (done) {
      var def = Hermes._normalizeQueue('some.queue')
      expect(def).to.deep.equal({ name: 'some.queue', opts: { durable: true }})
      done()
    })
    it('should return queueDef if queueDef is provided', function (done) {
      var def = Hermes._normalizeQueue({ name: 'some.queue' })
      expect(def).to.deep.equal({ name: 'some.queue', opts: { durable: true }})
      done()
    })
    it('should apply additional options', function (done) {
      var def = Hermes._normalizeQueue({ name: 'some.queue', opts: { expires: 2 }})
      expect(def).to.deep.equal({ name: 'some.queue', opts: { durable: true, expires: 2 }})
      done()
    })
    it('should be able to override default options', function (done) {
      var def = Hermes._normalizeQueue({ name: 'some.queue', opts: { expires: 2, durable: false }})
      expect(def).to.deep.equal({ name: 'some.queue', opts: { durable: false, expires: 2 }})
      done()
    })
    describe('use process.env.HERMES_QUEUE_EXPIRES', function () {
      beforeEach(function (done) {
        process.env.HERMES_QUEUE_EXPIRES = 3
        done()
      })
      afterEach(function (done) {
        delete process.env.HERMES_QUEUE_EXPIRES
        done()
      })
      it('should return queueDef if name is provided and use default expires', function (done) {
        var def = Hermes._normalizeQueue('some.queue')
        expect(def).to.deep.equal({ name: 'some.queue', opts: { durable: true, expires: 3 }})
        done()
      })
      it('should return queueDef if queueDef is provided and use default expire', function (done) {
        var def = Hermes._normalizeQueue({ name: 'some.queue' })
        expect(def).to.deep.equal({ name: 'some.queue', opts: { durable: true, expires: 3 }})
        done()
      })
      it('should not override per queue expires with default one', function (done) {
        var def = Hermes._normalizeQueue({ name: 'some.queue', opts: { expires: 20 }})
        expect(def).to.deep.equal({ name: 'some.queue', opts: { durable: true, expires: 20 }})
        done()
      })
    })
  })
});
