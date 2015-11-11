'use strict';

var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var afterEach = lab.afterEach;
var beforeEach = lab.beforeEach;
var Code = require('code');
var expect = Code.expect;

var put = require('101/put');
var createCount = require('callback-count');

var Hermes = require('../../index');

describe('events functional test', function () {
  var defaultOpts = {
    hostname: process.env.RABBITMQ_HOSTNAME || 'localhost',
    password: process.env.RABBITMQ_PASSWORD || 'guest' ,
    port: process.env.RABBITMQ_PORT || 5672,
    username: process.env.RABBITMQ_USERNAME || 'guest',
    name: 'Unknown'
  };

  describe('single client', function () {
    var testQueue = 'test1';
    var client;
    beforeEach(function (done) {
      client = new Hermes(put(defaultOpts, {
        publishedEvents: [testQueue],
        subscribedEvents: [testQueue]
      })).connect(done);
    });

    afterEach(function (done) {
      client.close(done);
    });

    it('should publish and get job', function (done) {
      var testData = { how: 'to' };
      client.subscribe(testQueue, function (data, _done) {
        expect(data).to.deep.equal(testData);
        _done();
        done();
      });

      client.publish(testQueue, testData);
    });
  }); // end single client

  describe('double client', function () {
    var testQueue = 'test2';
    var client1;
    var client2;

    beforeEach(function (done) {
      client1 = new Hermes(put(defaultOpts, {
        publishedEvents: [testQueue],
        name: 'Magikarp'
      })).connect(done);
    });

    beforeEach(function (done) {
      client2 = new Hermes(put(defaultOpts, {
        subscribedEvents: [testQueue],
        name: 'Gyarados'
      })).connect(done);
    });

    afterEach(function (done) {
      client1.close(done);
    });

    afterEach(function (done) {
      client2.close(done);
    });

    it('client1 publish and client2 gets job', function (done) {
      var testData = { how: 'to' };
      client2.subscribe(testQueue, function (data, _done) {
        expect(data).to.deep.equal(testData);
        _done();
        done();
      });

      client1.publish(testQueue, testData);
    });
  }); // end single client

  describe('triple client', function () {
    var testQueue = 'test3';
    var client1;
    var client2;
    var client3;

    beforeEach(function (done) {
      client1 = new Hermes(put(defaultOpts, {
        publishedEvents: [testQueue],
        name: 'Abra'
      })).connect(done);
    });

    beforeEach(function (done) {
      client2 = new Hermes(put(defaultOpts, {
        subscribedEvents: [testQueue],
        name: 'Kadabra'
      })).connect(done);
    });

    beforeEach(function (done) {
      client3 = new Hermes(put(defaultOpts, {
        subscribedEvents: [testQueue],
        name: 'Alakazam'
      })).connect(done);
    });

    afterEach(function (done) {
      client1.close(done);
    });

    afterEach(function (done) {
      client2.unsubscribe(testQueue, null);
      client2.close(done);
    });

    afterEach(function (done) {
      client3.unsubscribe(testQueue, null);
      client3.close(done);
    });

    it('client1 publish, client2 and client3 gets job', function (done) {
      var count = createCount(2, done);

      var testData = { how: 'to' };
      client2.subscribe(testQueue, function (data, _done) {
        expect(data).to.deep.equal(testData);
        _done();
        count.next();
      });

      client3.subscribe(testQueue, function (data, _done) {
        expect(data).to.deep.equal(testData);
        _done();
        count.next();
      });

      client1.publish(testQueue, testData);
    });
  }); // end single client
}); // end events functional test