'use strict';

var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var beforeEach = lab.beforeEach;
var Code = require('code');
var expect = Code.expect;
var sinon = require('sinon');

var EventJobs = require('../../../lib/event-jobs');

describe('event-jobs.js unit test', function () {
  describe('constructor', function () {
    it('should construct', function (done) {
      var eventJobs = new EventJobs({
        channel: 'testchannel',
        publishedEvents: 'testpublishedEvents',
        subscribedEvents: 'testsubscribedEvents',
        name: 'testName'
      });
      expect(eventJobs._publishedEvents).to.equal('testpublishedEvents');
      expect(eventJobs._subscribedEvents).to.equal('testsubscribedEvents');
      expect(eventJobs._name).to.equal('testName');
      done();
    });

    it('should construct with defaults', function (done) {
      var eventJobs = new EventJobs({
        channel: 'testchannel',
        name: 'gober'
      });
      expect(eventJobs._publishedEvents).to.deep.equal([]);
      expect(eventJobs._subscribedEvents).to.deep.equal([]);
      expect(eventJobs._name).to.equal('gober');
      done();
    });

    it('should throw if missing name', function (done) {
      expect(function () {
        new EventJobs({
          channel: 'gober'
        });
      }).to.throw();
      done();
    });
  }); // end constructor

  describe('setChannel', function () {
    var testEventJobs;

    beforeEach(function (done) {
      testEventJobs = new EventJobs({
        name: 'blue'
      });
      done();
    });

    it('should set channel', function (done) {
      var testCh = {
        test: 'channel'
      };
      testEventJobs.setChannel(testCh);
      expect(testEventJobs._channel).to.deep.equal(testCh);
      done();
    });
  }); // end setChannel

  describe('isPublishEvent', function () {
    it('should be false if not in array (empty)', function (done) {
      var testEventJobs = new EventJobs({
        channel: 'test',
        name: 'gober'
      });
      expect(!!testEventJobs.isPublishEvent('test'))
        .to.be.false();
      done();
    });

    it('should be false if not in array (full)', function (done) {
      var testEventJobs = new EventJobs({
        channel: 'test',
        name: 'gober',
        publishedEvents: ['a', 'b', 'c']
      });
      expect(!!testEventJobs.isPublishEvent('test'))
        .to.be.false();
      done();
    });

    it('should be true if in array', function (done) {
      var testEventJobs = new EventJobs({
        channel: 'test',
        name: 'gober',
        publishedEvents: ['a', 'b', 'c']
      });
      expect(!!testEventJobs.isPublishEvent('b'))
        .to.be.true();
      done();
    });
  }); // end isPublishEvent

  describe('assertExchanges', function () {
    var testEventJobs;

    beforeEach(function (done) {
      testEventJobs = new EventJobs({
        name: 'gober'
      });
      testEventJobs._channel = 'test';
      testEventJobs._assertExchange = sinon.stub();
      done();
    });

    it('should throw if no channel', function (done) {
      delete testEventJobs._channel;
      expect(function () {
        testEventJobs.assertExchanges();
      }).to.throw();
      done();
    });

    it('should do nothing if empty _publishedEvents', function (done) {
      testEventJobs.assertExchanges(function () {
        expect(testEventJobs._assertExchange.called).to.be.false();
        done();
      });
    });

    it('should call create for each item', function (done) {
      testEventJobs._publishedEvents = ['a', 'b', 'c'];
      testEventJobs._assertExchange.yieldsAsync();
      testEventJobs.assertExchanges(function () {
        expect(testEventJobs._assertExchange.calledThrice).to.be.true();
        done();
      });
    });
  }); // end assertExchanges

  describe('_assertExchange', function () {
    var testEventJobs;

    beforeEach(function (done) {
      testEventJobs = new EventJobs({
        name: 'blue'
      });
      testEventJobs.setChannel({
        assertExchange: sinon.stub()
      });
      done();
    });

    it('should call assertExchange', function (done) {
      var testName = 'name';
      testEventJobs._channel.assertExchange.yieldsAsync();

      testEventJobs._assertExchange(testName, function () {
        expect(testEventJobs._channel.assertExchange
          .withArgs(testName, 'fanout',  { durable: true })
          .called).to.be.true();
        done();
      });
    });
  }); // end _assertExchange

  describe('publish', function () {
    var testEventJobs;

    beforeEach(function (done) {
      testEventJobs = new EventJobs({
        name: 'blue'
      });
      testEventJobs.setChannel({
        publish: sinon.stub()
      });
      done();
    });

    it('should throw if no channel', function (done) {
      delete testEventJobs._channel;
      expect(function () {
        testEventJobs.publish();
      }).to.throw();
      done();
    });

    it('should call publish with default routingKey', function (done) {
      var testName = 'name';
      var testData = 'somdat';

      testEventJobs._channel.publish.returns();

      testEventJobs.publish(testName, testData);

      expect(testEventJobs._channel.publish
        .withArgs(testName, '',  testData)
        .called).to.be.true();
      done();
    });

    it('should call publish with routingKey', function (done) {
      var testName = 'name';
      var testData = 'somdat';
      var testKey = 'padlock';

      testEventJobs._channel.publish.returns();

      testEventJobs.publish(testName, testData, testKey);

      expect(testEventJobs._channel.publish
        .withArgs(testName, testKey,  testData)
        .called).to.be.true();
      done();
    });
  }); // end publish

  describe('isSubscribeEvent', function () {
    it('should be false if not in array (empty)', function (done) {
      var testEventJobs = new EventJobs({
        name: 'gober'
      });
      expect(!!testEventJobs.isSubscribeEvent('test'))
        .to.be.false();
      done();
    });

    it('should be false if not in array (full)', function (done) {
      var testEventJobs = new EventJobs({
        name: 'gober',
        subscribedEvents: ['a', 'b', 'c']
      });
      expect(!!testEventJobs.isSubscribeEvent('test'))
        .to.be.false();
      done();
    });

    it('should be true if in array', function (done) {
      var testEventJobs = new EventJobs({
        name: 'gober',
        subscribedEvents: ['a', 'b', 'c']
      });
      expect(!!testEventJobs.isSubscribeEvent('b'))
        .to.be.true();
      done();
    });
  }); // end isSubscribeEvent

  describe('assertAndBindQueues', function () {
    var testEventJobs;

    beforeEach(function (done) {
      testEventJobs = new EventJobs({
        name: 'gober'
      });
      testEventJobs.setChannel({
        test: 'channel'
      });
      testEventJobs._assertAndBindQueue = sinon.stub();
      done();
    });

    it('should throw if no channel', function (done) {
      delete testEventJobs._channel;
      expect(function () {
        testEventJobs.assertAndBindQueues();
      }).to.throw();
      done();
    });

    it('should do nothing if empty _subscribedEvents', function (done) {
      testEventJobs.assertAndBindQueues(function () {
        expect(testEventJobs._assertAndBindQueue.called).to.be.false();
        done();
      });
    });

    it('should call create for each item', function (done) {
      testEventJobs._subscribedEvents = ['a', 'b', 'c'];
      testEventJobs._assertAndBindQueue.yieldsAsync();
      testEventJobs.assertAndBindQueues(function () {
        expect(testEventJobs._assertAndBindQueue.calledThrice).to.be.true();
        done();
      });
    });
  }); // end assertAndBindQueues

  describe('_assertAndBindQueue', function () {
    var testEventJobs;

    beforeEach(function (done) {
      testEventJobs = new EventJobs({
        name: 'blue'
      });
      testEventJobs.setChannel({
        assertQueue: sinon.stub(),
        bindQueue: sinon.stub()
      });
      done();
    });

    it('should call assertQueue and bindQueue', function (done) {
      var testEvent = 'ev';
      var queueName = 'blue.ev';
      testEventJobs._channel.assertQueue.yieldsAsync();
      testEventJobs._channel.bindQueue.yieldsAsync();

      testEventJobs._assertAndBindQueue(testEvent, function (err) {
        expect(err).to.not.exist();
        expect(testEventJobs._channel.assertQueue
          .withArgs(queueName, { durable: true })
          .called).to.be.true();
        expect(testEventJobs._channel.bindQueue
          .withArgs(queueName, testEvent, '')
          .called).to.be.true();
        done();
      });
    });

    it('should call assertQueue and bindQueue with name appended', function (done) {
      var testName = 'myName';
      var testEvent = 'ev';
      var queueName = 'myName.ev';
      testEventJobs._name = testName;
      testEventJobs._channel.assertQueue.yieldsAsync();
      testEventJobs._channel.bindQueue.yieldsAsync();

      testEventJobs._assertAndBindQueue(testEvent, function (err) {
        expect(err).to.not.exist();
        expect(testEventJobs._channel.assertQueue
          .withArgs(queueName, { durable: true })
          .called).to.be.true();
        expect(testEventJobs._channel.bindQueue
          .withArgs(queueName, testEvent, '')
          .called).to.be.true();
        done();
      });
    });

    it('should cb err when assertQueue failed', function (done) {
      var testEvent = 'ev';
      var queueName = 'blue.ev';
      testEventJobs._channel.assertQueue.yieldsAsync('err');

      testEventJobs._assertAndBindQueue(testEvent, function (err) {
        expect(err).to.exist();
        expect(testEventJobs._channel.assertQueue
          .withArgs(queueName, { durable: true })
          .called).to.be.true();
        expect(testEventJobs._channel.bindQueue
          .called).to.be.false();
        done();
      });
    });
  }); // end _assertAndBindQueue

  describe('subscribe', function () {
    var testEventJobs;

    beforeEach(function (done) {
      testEventJobs = new EventJobs({
        name: 'blue'
      });
      testEventJobs.setChannel({
        consume: sinon.stub()
      });
      done();
    });

    it('should throw if no channel', function (done) {
      delete testEventJobs._channel;
      expect(function () {
        testEventJobs.subscribe();
      }).to.throw();
      done();
    });

    it('should call consume with empty name', function (done) {
      var testEvent = 'evt';
      var queueName = 'blue.evt';
      testEventJobs._channel.consume.yieldsAsync();

      testEventJobs.subscribe(testEvent, function () {
        expect(testEventJobs._channel.consume
          .withArgs(queueName)
          .called).to.be.true();
        done();
      });
    });

    it('should call consume with name', function (done) {
      var testName = 'nemo';
      var testEvent = 'evt';
      var queueName = 'nemo.evt';
      testEventJobs._channel.consume.yieldsAsync();
      testEventJobs._name = testName;

      testEventJobs.subscribe(testEvent, function () {
        expect(testEventJobs._channel.consume
          .withArgs(queueName)
          .called).to.be.true();
        done();
      });
    });
  }); // end consume
}); // end event-jobs.js unit test
