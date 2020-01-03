const chai = require('chai');
const nock = require('nock');
const {handler, options} = require('../');

chai.config.truncateThreshold = 0;

Object.assign(global, {
  assert: chai.assert,
  nock,
  handler,
  options,
});

beforeEach(() => {
  options.targetUrl = 'http://localhost';
  options.timeout = 250;
  options.allowedUsers = [];
});

afterEach(() => {
  nock.cleanAll();
});
