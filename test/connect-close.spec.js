/**
 * @module test/index.spec
 */
'use strict';

var Code = require('code');
var Lab = require('lab');
var rewire = require('rewire');
var sinon = require('sinon');

var Hermes = rewire('../index');

var connectionOpts = require('./fixtures/connection-opts');
var createMockChannel = require('./fixtures/create-mock-channel');
var createMockConn = require('./fixtures/create-mock-connection');
var Hermes = require('../index.js');
var amqplib = require('amqplib/callback_api');

var lab = exports.lab = Lab.script();

var afterEach = lab.afterEach;
var beforeEach = lab.beforeEach;
var describe = lab.describe;
var expect = Code.expect;
var it = lab.it;

describe('hermes', function () {
  var ctx;
  beforeEach(function (done) {
    ctx = {};
    done();
  });

  describe('connect and close', function () {
    beforeEach(function (done) {
      var mockChannel = ctx.mockChannel = createMockChannel();
      mockChannel.assertQueue.yieldsAsync();
      mockChannel.close.yieldsAsync();

      var mockConn = ctx.mockConn = createMockConn();
      mockConn.createChannel.yieldsAsync(null, mockChannel);
      mockConn.close.yieldsAsync();

      sinon.stub(amqplib, 'connect').yieldsAsync(null, mockConn);
      done();
    });
    afterEach(function (done) {
      amqplib.connect.restore();
      done();
    });

    it('should connect and close', function (done) {
      var hermes = Hermes.hermesSingletonFactory(connectionOpts.standard);
      hermes.connect(function (err) {
        if (err) { return done(err); }
        expect(hermes._connection).to.equal(ctx.mockConn);
        expect(hermes._channel).to.equal(ctx.mockChannel);
        hermes.close(function (err) {
          if (err) { return done(err); }
          expect(hermes._connection).to.be.undefined();
          expect(hermes._channel).to.be.undefined();
          done();
        });
      });
    });
  });
});
