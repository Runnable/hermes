/**
 * @module test/lib/assert-opts.spec
 */
'use strict';

var Code = require('code');
var Lab = require('lab');

var assertOpts = require('../../lib/assert-opts');
var connectionOpts = require('../fixtures/connection-opts');

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

  it('should default `persistent` opt to true', function (done) {
    var opts = {
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
});
