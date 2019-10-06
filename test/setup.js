const chai = require('chai');
const nock = require('nock');

chai.config.truncateThreshold = 0;

global.assert = chai.assert;
global.nock = nock;

afterEach(() => {
  nock.cleanAll();
});
