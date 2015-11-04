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
      expect(eventJobs._channel).to.equal('testchannel');
      done();
    });

    it('should construct with defaults', function (done) {
      var eventJobs = new EventJobs({
        channel: 'testchannel'
      });
      expect(eventJobs._publishedEvents).to.deep.equal([]);
      expect(eventJobs._subscribedEvents).to.deep.equal([]);
      expect(eventJobs._name).to.equal('');
      expect(eventJobs._channel).to.equal('testchannel');
      done();
    });

    it('should throw if missing channel', function (done) {
      expect(function () {
        new EventJobs({});
      }).to.throw();
      done();
    });
  }); // end constructor

  describe('isPublishEvent', function () {
    it('should be false if not in array (empty)', function (done) {
      var testEventJobs = new EventJobs({
        channel: 'test'
      });
      expect(!!testEventJobs.isPublishEvent('test'))
        .to.be.false();
      done();
    });

    it('should be false if not in array (full)', function (done) {
      var testEventJobs = new EventJobs({
        channel: 'test',
        publishedEvents: ['a', 'b', 'c']
      });
      expect(!!testEventJobs.isPublishEvent('test'))
        .to.be.false();
      done();
    });

    it('should be true if in array', function (done) {
      var testEventJobs = new EventJobs({
        channel: 'test',
        publishedEvents: ['a', 'b', 'c']
      });
      expect(!!testEventJobs.isPublishEvent('b'))
        .to.be.true();
      done();
    });
  }); // end isPublishEvent

  describe('createExchanges', function () {
    var testEventJobs;

    beforeEach(function (done) {
      testEventJobs = new EventJobs({
        channel: 'test'
      });
      testEventJobs._createExchange = sinon.stub();
      done();
    });

    it('should do nothing if empty _publishedEvents', function (done) {
      testEventJobs.createExchanges(function () {
        expect(testEventJobs._createExchange.called).to.be.false();
        done();
      });
    });

    it('should call create for each item', function (done) {
      testEventJobs._publishedEvents = ['a', 'b', 'c'];
      testEventJobs._createExchange.yieldsAsync();
      testEventJobs.createExchanges(function () {
        expect(testEventJobs._createExchange.calledThrice).to.be.true();
        done();
      });
    });
  }); // end createExchanges

  describe('_createExchange', function () {
    var testEventJobs;

    beforeEach(function (done) {
      testEventJobs = new EventJobs({
        channel: {
          assertExchange: sinon.stub()
        }
      });
      done();
    });

    it('should call assertExchange', function (done) {
      var testName = 'name';
      testEventJobs._channel.assertExchange.yieldsAsync();

      testEventJobs._createExchange(testName, function () {
        expect(testEventJobs._channel.assertExchange
          .withArgs(testName, 'fanout',  { durable: true })
          .called).to.be.true();
        done();
      });
    });
  }); // end _createExchange

  describe('publish', function () {
    var testEventJobs;

    beforeEach(function (done) {
      testEventJobs = new EventJobs({
        channel: {
          publish: sinon.stub()
        }
      });
      done();
    });

    it('should call publish', function (done) {
      var testName = 'name';
      var testData = 'somdat';

      testEventJobs._channel.publish.returns();

      testEventJobs.publish(testName, testData);

      expect(testEventJobs._channel.publish
        .withArgs(testName, '',  testData)
        .called).to.be.true();
      done();
    });
  }); // end publish

  describe('isSubscribeEvent', function () {
    it('should be false if not in array (empty)', function (done) {
      var testEventJobs = new EventJobs({
        channel: 'test'
      });
      expect(!!testEventJobs.isSubscribeEvent('test'))
        .to.be.false();
      done();
    });

    it('should be false if not in array (full)', function (done) {
      var testEventJobs = new EventJobs({
        channel: 'test',
        subscribedEvents: ['a', 'b', 'c']
      });
      expect(!!testEventJobs.isSubscribeEvent('test'))
        .to.be.false();
      done();
    });

    it('should be true if in array', function (done) {
      var testEventJobs = new EventJobs({
        channel: 'test',
        subscribedEvents: ['a', 'b', 'c']
      });
      expect(!!testEventJobs.isSubscribeEvent('b'))
        .to.be.true();
      done();
    });
  }); // end isSubscribeEvent

  describe('createQueues', function () {
    var testEventJobs;

    beforeEach(function (done) {
      testEventJobs = new EventJobs({
        channel: 'test'
      });
      testEventJobs._createQueue = sinon.stub();
      done();
    });

    it('should do nothing if empty _subscribedEvents', function (done) {
      testEventJobs.createQueues(function () {
        expect(testEventJobs._createQueue.called).to.be.false();
        done();
      });
    });

    it('should call create for each item', function (done) {
      testEventJobs._subscribedEvents = ['a', 'b', 'c'];
      testEventJobs._createQueue.yieldsAsync();
      testEventJobs.createQueues(function () {
        expect(testEventJobs._createQueue.calledThrice).to.be.true();
        done();
      });
    });
  }); // end createQueues

  describe('publish', function () {
    var testEventJobs;

    beforeEach(function (done) {
      testEventJobs = new EventJobs({
        channel: {
          publish: sinon.stub()
        }
      });
      done();
    });

    it('should call publish', function (done) {
      var testName = 'name';
      var testData = 'somdat';

      testEventJobs._channel.publish.returns();

      testEventJobs.publish(testName, testData);

      expect(testEventJobs._channel.publish
        .withArgs(testName, '',  testData)
        .called).to.be.true();
      done();
    });
  }); // end publish

  describe('_createQueue', function () {
    var testEventJobs;

    beforeEach(function (done) {
      testEventJobs = new EventJobs({
        channel: {
          assertQueue: sinon.stub(),
          bindQueue: sinon.stub()
        }
      });
      done();
    });

    it('should call assertQueue and bindQueue', function (done) {
      var testEvent = 'ev';
      var queueName = testEvent + 'queue';
      testEventJobs._channel.assertQueue.yieldsAsync();
      testEventJobs._channel.bindQueue.yieldsAsync();

      testEventJobs._createQueue(testEvent, function (err) {
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
      var queueName = testName + testEvent + 'queue';
      testEventJobs._name = testName;
      testEventJobs._channel.assertQueue.yieldsAsync();
      testEventJobs._channel.bindQueue.yieldsAsync();

      testEventJobs._createQueue(testEvent, function (err) {
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
      var queueName = testEvent + 'queue';
      testEventJobs._channel.assertQueue.yieldsAsync('err');

      testEventJobs._createQueue(testEvent, function (err) {
        expect(err).to.exist();
        expect(testEventJobs._channel.assertQueue
          .withArgs(queueName, { durable: true })
          .called).to.be.true();
        expect(testEventJobs._channel.bindQueue
          .called).to.be.false();
        done();
      });
    });
  }); // end _createQueue

  describe('subscribe', function () {
    var testEventJobs;

    beforeEach(function (done) {
      testEventJobs = new EventJobs({
        channel: {
          consume: sinon.stub()
        }
      });
      done();
    });

    it('should call consume with empty name', function (done) {
      var testEvent = 'evt';
      var queueName = testEvent + 'queue';
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
      var queueName = testName + testEvent + 'queue';
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