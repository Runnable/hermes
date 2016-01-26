/**
 * @module test/lib/assert-opts.spec
 */
'use strict';

var Code = require('code');
var Lab = require('lab');

var assertOpts = require('../../../lib/assert-opts');

var lab = exports.lab = Lab.script();

var describe = lab.describe;
var expect = Code.expect;
var it = lab.it;

describe('assertOpts', function () {
  it('should throw an exception if not supplied correct opts', function (done) {
    var throws = function () {
      return assertOpts({});
    };
    expect(throws).to.throw();
    done();
  });

  it('should throw an error if missing queues or events', function(done) {
    expect(function () {
      assertOpts({
        name: 'nemo',
        hostname: 'bobsburgers.net',
        port: '1111',
        username: 'tom',
        password: 'harry'
      });
    }).to.throw();
    done();
  });

  it('should throw an error if the `queues` value is not an array', function(done) {
    expect(function () {
      assertOpts({
        name: 'nemo',
        hostname: 'bobsburgers.net',
        port: '1111',
        username: 'tom',
        password: 'harry',
        queues: 'woot'
      });
    }).to.throw();
    done();
  });

  it('should throw if the queues value contains non string', function(done) {
    expect(function () {
      assertOpts({
        name: 'nemo',
        hostname: 'bobsburgers.net',
        port: '1111',
        username: 'tom',
        password: 'harry',
        queues: ['good', 'good', 123]
      });
    }).to.throw();
    done();
  });

  it('should not throw if the publishedEvents correct', function(done) {
    expect(function () {
      assertOpts({
        name: 'nemo',
        hostname: 'bobsburgers.net',
        port: '1111',
        username: 'tom',
        password: 'harry',
        publishedEvents: ['good', 'good', 'good']
      });
    }).to.not.throw();
    done();
  });

  it('should throw an error if the `publishedEvents` value is not an array', function(done) {
    expect(function () {
      assertOpts({
        name: 'nemo',
        hostname: 'bobsburgers.net',
        port: '1111',
        username: 'tom',
        password: 'harry',
        publishedEvents: 'woot'
      });
    }).to.throw();
    done();
  });

  it('should throw if the publishedEvents value contains non string', function(done) {
    expect(function () {
      assertOpts({
        name: 'nemo',
        hostname: 'bobsburgers.net',
        port: '1111',
        username: 'tom',
        password: 'harry',
        publishedEvents: ['good', 'good', 123]
      });
    }).to.throw();
    done();
  });

  it('should not throw if the subscribedEvents correct', function(done) {
    expect(function () {
      assertOpts({
        name: 'nemo',
        hostname: 'bobsburgers.net',
        port: '1111',
        username: 'tom',
        password: 'harry',
        subscribedEvents: ['good', 'good', 'good']
      });
    }).to.not.throw();
    done();
  });

  it('should throw an error if the `subscribedEvents` value is not an array', function(done) {
    expect(function () {
      assertOpts({
        name: 'nemo',
        hostname: 'bobsburgers.net',
        port: '1111',
        username: 'tom',
        password: 'harry',
        subscribedEvents: 'woot'
      });
    }).to.throw();
    done();
  });

  it('should throw if the subscribedEvents value contains non string', function(done) {
    expect(function () {
      assertOpts({
        name: 'nemo',
        hostname: 'bobsburgers.net',
        port: '1111',
        username: 'tom',
        password: 'harry',
        subscribedEvents: ['good', 'good', 123]
      });
    }).to.throw();
    done();
  });

  it('should not throw if the subscribedEvents correct', function(done) {
    expect(function () {
      assertOpts({
        name: 'nemo',
        hostname: 'bobsburgers.net',
        port: '1111',
        username: 'tom',
        password: 'harry',
        subscribedEvents: ['good', 'good', 'good']
      });
    }).to.not.throw();
    done();
  });

  it('should not throw if name is string', function(done) {
    expect(function () {
      assertOpts({
        hostname: 'bobsburgers.net',
        port: '1111',
        username: 'tom',
        password: 'harry',
        subscribedEvents: ['good', 'good', 'good'],
        name: '50 cent'
      });
    }).to.not.throw();
    done();
  });

  it('should not throw if name not string', function(done) {
    expect(function () {
      assertOpts({
        hostname: 'bobsburgers.net',
        port: '1111',
        username: 'tom',
        password: 'harry',
        subscribedEvents: ['good', 'good', 'good'],
        name: {}
      });
    }).to.throw();
    done();
  });

  it('should not throw if no name', function(done) {
    expect(function () {
      assertOpts({
        hostname: 'bobsburgers.net',
        port: '1111',
        username: 'tom',
        password: 'harry',
        subscribedEvents: ['good', 'good', 'good']
      });
    }).to.throw();
    done();
  });

  it('should default `persistent` opt to true', function (done) {
    var opts = {
      name: 'nemo',
      hostname: 'hostname',
      port: '5672',
      username: 'guest',
      password: 'guest',
      queues: [
        'queue-1'
      ]
    };
    assertOpts(opts);
    expect(opts.persistent).to.equal(true);
    done();
  });

  it('should set persistent', function (done) {
    var opts = {
      name: 'nemo',
      hostname: 'hostname',
      port: '5672',
      username: 'guest',
      password: 'guest',
      persistent: false,
      queues: [
        'queue-1'
      ]
    };
    assertOpts(opts);
    expect(opts.persistent).to.equal(false);
    done();
  });

  describe('_checkQueueDef', function () {
    it('should return true if string', function (done) {
      expect(assertOpts._checkQueueDef('anton')).to.be.true()
      done()
    })
    it('should return true if has name prop', function (done) {
      expect(assertOpts._checkQueueDef({ name: 'anton' })).to.be.true()
      done()
    })
    it('should return false if number', function (done) {
      expect(assertOpts._checkQueueDef(1)).to.be.false()
      done()
    })
    it('should return false if has no name prop', function (done) {
      expect(assertOpts._checkQueueDef({ notName: 'anton' })).to.be.false()
      done()
    })
  })

  describe('_doesQueueExist', function () {
    it('should return true if queue exists', function (done) {
      var queues = [
        { name: 'a', opts: { durable: true } },
        { name: 'b', opts: { durable: true } },
        { name: 'c', opts: { durable: true } }
      ]
      expect(assertOpts.doesQueueExist(queues, 'b')).to.be.true()
      done()
    })

    it('should return false if queue does not exist', function (done) {
      var queues = [
        { name: 'a', opts: { durable: true } },
        { name: 'b', opts: { durable: true } },
        { name: 'c', opts: { durable: true } }
      ]
      expect(assertOpts.doesQueueExist(queues, 'd')).to.be.false()
      done()
    })
  })
});
