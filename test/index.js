/**
 * @module test/index
 */
'use strict';

var Code = require('code');
var Lab = require('lab');
var rewire = require('rewire');
var sinon = require('sinon');

var Hermes = rewire('../index');

var lab = exports.lab = Lab.script();

var after = lab.after;
var afterEach = lab.afterEach;
var before = lab.before;
var beforeEach = lab.beforeEach;
var describe = lab.describe;
var expect = Code.expect;
var it = lab.it;

describe('hermes', function () {
  it('should throw an exception if not supplied correct opts', function (done) {
    var throws = function () {
      return new Hermes({});
    };
    expect(throws).to.throw();
    done();
  });

  it('should initiate a connection to a rabbitmq server', function (done) {
    var hermesAmqplib = Hermes.__get__('amqplib');
    sinon.stub(hermesAmqplib, 'connect', function (url) {
      expect(url).to.be.a.string();
      expect(url).to.equal('amqp://tom:harry@bobsburgers.net:1111');
      hermesAmqplib.connect.restore();
      done();
    });
    var hermes = new Hermes({
      hostname: 'bobsburgers.net',
      port: '1111',
      username: 'tom',
      password: 'harry'
    });
  });
});
