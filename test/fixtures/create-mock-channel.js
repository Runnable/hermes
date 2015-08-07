/**
 * @module test/fixtures/mock-channel
 */
'use strict';

var sinon = require('sinon');

module.exports = createMockChannel;

/**
 * create a mock channel
 * @return {mockChannel}
 */
function createMockChannel () {
  var mockChannel = {
    ack: sinon.stub(),
    assertQueue: sinon.stub(),
    consume: sinon.stub(),
    sendToQueue: sinon.stub(),
    cancel: sinon.stub(),
    close: sinon.stub()
  };
  return mockChannel;
}
