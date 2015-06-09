/**
 * @module test/fixtures/mock-channel
 */
'use strict';

var sinon = require('sinon');
var noop = require('101/noop');

/**
 * @param {Array} callbacks
 * @return {Object}
 */
module.exports = function () {
  var fakeChannel = {
    ack: noop,
    assertQueue: noop,
    consume: noop,
    sendToQueue: noop,
    cancel: noop
  };
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
  return fakeChannel;
};
