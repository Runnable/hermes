/**
 * @module test/fixtures/mock-channel
 */
'use strict';

var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var sinon = require('sinon');
var noop = require('101/noop');

function FakeChannel () {
  EventEmitter.call(this);
}
inherits(FakeChannel, EventEmitter);

FakeChannel.prototype.ack = noop;
FakeChannel.prototype.assertQueue = noop;
FakeChannel.prototype.consume = noop;
FakeChannel.prototype.sendToQueue = noop;
FakeChannel.prototype.cancel = noop;
FakeChannel.prototype.prefetch = noop;

/**
 * @param {Array} callbacks
 * @return {Object}
 */
module.exports = function () {
  var fakeChannel = new FakeChannel();
  sinon.stub(fakeChannel, 'assertQueue', function (queueName, opts, cb) {
    cb();
  });
  sinon.stub(fakeChannel, 'sendToQueue', function (queueName, data) {});
  sinon.stub(fakeChannel, 'consume', function (queueName, callback) {
    //callback();
  });
  sinon.stub(fakeChannel, 'cancel', function (consumerTag, callback) {
    callback();
  });
  sinon.stub(fakeChannel, 'prefetch').returns();
  return fakeChannel;
};
