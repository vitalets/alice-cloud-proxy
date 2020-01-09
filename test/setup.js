const chai = require('chai');
const nock = require('nock');
const { handler } = require('../');
const config = require('../src/config');

chai.config.truncateThreshold = 0;

Object.assign(global, {
  assert: chai.assert,
  nock,
  handler,
  config,
});

beforeEach(() => {
  config.targetUrl = 'http://localhost';
  config.timeout = 250;
  config.allowedUsers = [];
});

afterEach(() => {
  nock.cleanAll();
});
