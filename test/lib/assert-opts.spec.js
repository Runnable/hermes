/**
 * @module test/lib/assert-opts.spec
 */
'use strict';

var Code = require('code');
var Lab = require('lab');
var rewire = require('rewire');
var sinon = require('sinon');
var defaults = require('101/defaults');


var assertOpts = rewire('lib/assert-opts');
var connectionOpts = require('../fixtures/connection-opts');

var lab = exports.lab = Lab.script();

var after = lab.after;
var afterEach = lab.afterEach;
var before = lab.before;
var beforeEach = lab.beforeEach;
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

  it('should throw an error if the `queues` is missing', function(done) {
    expect(function () {
      assertOpts(connectionOpts.noQueues);
    }).to.throw();
    done();
  });

  it('should throw an error if the `queues` value is not an array', function(done) {
    expect(function () {
      assertOpts(connectionOpts.malformedQueues);
    }).to.throw();
    done();
  });

  it('should throw an error if the `queues` value contains an array value that is not a string',
  function(done) {
    expect(function () {
      assertOpts(connectionOpts.malformedQueuesBadEntries);
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
});
