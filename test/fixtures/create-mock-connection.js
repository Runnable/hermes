/**
 * @module test/fixtures/mock-connection
 */
'use strict';

var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;

var sinon = require('sinon');

module.exports = createMockConnection;

function MockConnection () {
  EventEmitter.call(this);
}
inherits(MockConnection, EventEmitter);


/**
 * create a mock connection
 * @return {mockConnection}
 */
function createMockConnection () {
  var mockConnection = new MockConnection();
  mockConnection.createChannel = sinon.stub();
  mockConnection.close = sinon.stub();
  return mockConnection;
}
