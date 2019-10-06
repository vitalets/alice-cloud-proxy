const {handler, options} = require('../src/index');

describe('handler', () => {

  beforeEach(() => {
    options.targetUrl = 'http://localhost';
    options.timeout = 250;
  });

  it('proxy ok', async () => {
    const scope = nock('http://localhost')
      .post('/')
      .reply(200, {
        response: {
          text: 'bar'
        }
      });

    const response = await handler({
      request: {command: 'foo'},
    });

    scope.done();
    assert.deepEqual(response, {
      response: {
        text: 'bar'
      }
    });
  });

  it('proxy timeout', async () => {
    nock('http://localhost')
      .post('/')
      .delay(300)
      .reply(200);

    const response = await handler({
      request: {command: 'foo'},
      session: 1,
      version: 2,
    });

    assert.deepEqual(response, {
      response: {
        text: 'Target timeout',
        tts: 'ошибка',
        end_session: false
      },
      session: 1,
      version: 2,
    });
  });

  it('target http error', async () => {
    const scope = nock('http://localhost')
      .post('/')
      // nock can't st statusMessage
      // see: https://github.com/nock/nock/issues/469
      .reply(500);

    const response = await handler({
      request: {command: 'foo'},
      session: 1,
      version: 2,
    });

    scope.done();
    assert.deepEqual(response, {
      response: {
        text: '500 null http://localhost',
        tts: 'ошибка',
        end_session: false
      },
      session: 1,
      version: 2,
    });
  });

  it('target network error', async () => {
    const scope = nock('http://localhost')
      .post('/')
      .replyWithError('err message');

    const response = await handler({
      request: {command: 'foo'},
      session: 1,
      version: 2,
    });

    scope.done();
    assert.deepEqual(response, {
      response: {
        text: 'err message',
        tts: 'ошибка',
        end_session: false
      },
      session: 1,
      version: 2,
    });
  });

  it('ping', async () => {
    const scope = nock('http://localhost')
      .post('/')
      .reply(200, { });

    const response = await handler({
      request: {command: 'ping'},
      session: 1,
      version: 2,
    });

    assert.equal(scope.isDone(), false);
    assert.deepEqual(response, {
      response: {
        text: 'pong',
        end_session: false
      },
      session: 1,
      version: 2,
    });
  });

  it('no target url', async () => {
    options.targetUrl = '';

    const response = await handler({
      request: {command: 'foo'},
      session: 1,
      version: 2,
    });

    assert.deepEqual(response, {
      response: {
        text: 'Please set TARGET_URL in environment',
        tts: 'ошибка',
        end_session: false
      },
      session: 1,
      version: 2,
    });
  });
});
