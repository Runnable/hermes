/**
 * @module test/fixtures/mock-channel
 */
'use strict';

var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var sinon = require('sinon');

module.exports = createMockChannel;

function MockChannel () {
  EventEmitter.call(this);
}
inherits(MockChannel, EventEmitter);


/**
 * create a mock channel
 * @return {mockChannel}
 */
function createMockChannel () {
  var mockChannel = new MockChannel();
  mockChannel.ack = sinon.stub();
  mockChannel.assertQueue = sinon.stub();
  mockChannel.consume = sinon.stub();
  mockChannel.sendToQueue = sinon.stub();
  mockChannel.cancel = sinon.stub();
  mockChannel.close = sinon.stub();

  return mockChannel;
}
