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
var mockChannel = require('./fixtures/mock-channel');

var lab = exports.lab = Lab.script();

var after = lab.after;
var afterEach = lab.afterEach;
var before = lab.before;
var beforeEach = lab.beforeEach;
var describe = lab.describe;
var expect = Code.expect;
var it = lab.it;

describe('hermes', function () {
  var HermesClass = Hermes.__get__('Hermes');

  it('should throw an exception if not supplied correct opts', function (done) {
    var throws = function () {
      return Hermes.hermesSingletonFactory({});
    };
    expect(throws).to.throw();
    done();
  });

  it('should initiate a connection to a rabbitmq server on instantiate', function (done) {
    var hermesAmqplib = Hermes.__get__('amqplib');
    sinon.stub(hermesAmqplib, 'connect', function (url) {
      expect(url).to.be.a.string();
      expect(url).to.equal('amqp://tom:harry@bobsburgers.net:1111');
      hermesAmqplib.connect.restore();
      done();
    });
    var hermes = Hermes.hermesSingletonFactory(connectionOpts.standard);
  });

  it('should correctly construct connection url string without a specified port', function (done) {
    var hermesAmqplib = Hermes.__get__('amqplib');
    sinon.stub(hermesAmqplib, 'connect', function (url) {
      expect(url).to.be.a.string();
      expect(url).to.equal('amqp://tom:harry@bobsburgers.net');
      hermesAmqplib.connect.restore();
      done();
    });
    var hermes = new HermesClass(connectionOpts.noSpecPort);
  });

  describe('pre-connect queue', function () {
    var TEST_QUEUE = 'test-queue';
    var channel;
    var connectFinish;
    var hermes;
    var hermesAmqplib;
    var originalQueues;

    beforeEach(function (done) {
      originalQueues = Hermes.__get__('queues')
      Hermes.__set__('queues', [TEST_QUEUE]);

      hermesAmqplib = Hermes.__get__('amqplib');
      // connectFinish allow testing pre-post connected states
      sinon.stub(hermesAmqplib, 'connect', function (url, cb) {
        connectFinish = function () {
          cb(null, {
            createChannel: function (cb) {
              channel = mockChannel();
              cb(null, channel);
            }
          });
        };
      });
      hermes = new HermesClass(connectionOpts.standard);
      done();
    });

    afterEach(function (done) {
      hermesAmqplib.connect.restore();
      Hermes.__set__('queues', originalQueues);
      done();
    });

    it('should automatically queue subscribe invokations until connected to RabbitMQ server', function (done) {
      expect(hermesAmqplib.connect.callCount).to.equal(1);
      // not yet connected...
      var subscribeCB = function (data, done) {};
      hermes.subscribe(TEST_QUEUE, subscribeCB);
      expect(hermes.subscribeQueue).to.have.length(1);
      // simulate connection complete
      connectFinish();
      // all queued subscribe jobs are complete
      expect(hermes.subscribeQueue).to.have.length(0);
      done();
    });

    it('should automatically queue publish invokations until connected to RabbitMQ server', function (done) {
      expect(hermesAmqplib.connect.callCount).to.equal(1);
      // not yet connected...
      var testData = {foo: 'bar'};
      hermes.publish(TEST_QUEUE, testData);
      expect(hermes.publishQueue).to.have.length(1);
      // simulate connection complete
      connectFinish();
      // all queued subscribe jobs are complete
      expect(hermes.publishQueue).to.have.length(0);
      done();
    });

    it('should not queue publish invokations if already connected to RabbitMQ server', function (done) {
      expect(hermesAmqplib.connect.callCount).to.equal(1);
      connectFinish();
      // connected...
      var testData = {foo: 'bar'};
      expect(hermes.publishQueue).to.have.length(0);
      hermes.publish(TEST_QUEUE, testData);
      expect(hermes.publishQueue).to.have.length(0);
      expect(channel.sendToQueue.callCount).to.equal(1);
      expect(channel.sendToQueue.args[0][0]).to.equal(TEST_QUEUE);
      expect(channel.sendToQueue.args[0][1].toString())
        .to.equal(new Buffer(JSON.stringify(testData)).toString());
      done();
    });

    it('should not queue subscribe invokations if already connected to RabbitMQ server', function (done) {
      expect(hermesAmqplib.connect.callCount).to.equal(1);
      connectFinish();
      // connected...
      var subscribeCB = function (data, done) {};
      hermes.subscribe(TEST_QUEUE, subscribeCB);
      expect(hermes.subscribeQueue).to.have.length(0);
      expect(channel.consume.callCount).to.equal(1);
      expect(channel.consume.args[0][0]).to.equal(TEST_QUEUE);
      done();
    });

    it('should remove workers from subscribe queue on unsubscribe if not yet connected', function (done) {
      expect(hermesAmqplib.connect.callCount).to.equal(1);
      // not yet connected...
      var worker = function (data, done) {};
      hermes.subscribe(TEST_QUEUE, worker);

      expect(hermes.subscribeQueue).to.have.length(1);
      expect(Object.keys(hermes.consumerTags)).to.have.length(1);
      hermes.unsubscribe(TEST_QUEUE, worker);

      expect(hermes.subscribeQueue).to.have.length(0);
      expect(Object.keys(hermes.consumerTags)).to.have.length(0);
      done();
    });

  });
});
