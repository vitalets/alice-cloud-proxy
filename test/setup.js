const chai = require('chai');
const nock = require('nock');
const { handler } = require('../');
const config = require('../src/config');

chai.config.truncateThreshold = 0;

const callFn = reqBody => handler(reqBody, { requestId: 'req12345678' });

Object.assign(global, {
  assert: chai.assert,
  nock,
  callFn,
  config,
});

beforeEach(() => {
  // reset config before each test
  config.targetUrl = 'http://localhost';
  config.timeout = 250;
  config.errorText = '';
  config.tgNotifyUrl = '';
  config.tgNotifyPrefix = '';
});

afterEach(() => {
  nock.cleanAll();
});
