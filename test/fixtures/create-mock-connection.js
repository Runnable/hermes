/**
 * @module test/fixtures/mock-connection
 */
'use strict';

var sinon = require('sinon');

module.exports = createMockConnection;

/**
 * create a mock connection
 * @return {mockConnection}
 */
function createMockConnection () {
  var mockConn = {
    createChannel: sinon.stub(),
    close: sinon.stub()
  };
  return mockConn;
}
