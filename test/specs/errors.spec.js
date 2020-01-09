describe('errors', () => {

  it('no target url', async () => {
    config.targetUrl = '';

    const response = await handler({
      request: {
        command: 'foo'
      },
      session: 1,
      version: 2,
    });

    assert.deepEqual(response, {
      response: {
        text: 'Please set targetUrl in config.js',
        tts: 'Ошибка',
        end_session: false
      },
      session: 1,
      version: 2,
    });
  });

  it('http timeout', async () => {
    nock('http://localhost')
      .post('/')
      .delay(300)
      .reply(200);

    const response = await handler({
      request: {
        command: 'foo'
      },
      session: 1,
      version: 2,
    });

    assert.deepEqual(response, {
      response: {
        text: 'Target timeout: 250 ms',
        tts: 'Ошибка',
        end_session: false
      },
      session: 1,
      version: 2,
    });
  });

  it('http error', async () => {
    const scope = nock('http://localhost')
      .post('/')
      // nock can't set statusMessage
      // see: https://github.com/nock/nock/issues/469
      .reply(500);

    const response = await handler({
      request: {
        command: 'foo'
      },
      session: 1,
      version: 2,
    });

    scope.done();
    assert.deepEqual(response, {
      response: {
        text: '500 null http://localhost',
        tts: 'Ошибка',
        end_session: false
      },
      session: 1,
      version: 2,
    });
  });

  it('network error', async () => {
    const scope = nock('http://localhost')
      .post('/')
      .replyWithError('err message');

    const response = await handler({
      request: {
        command: 'foo'
      },
      session: 1,
      version: 2,
    });

    scope.done();
    assert.deepEqual(response, {
      response: {
        text: 'err message',
        tts: 'Ошибка',
        end_session: false
      },
      session: 1,
      version: 2,
    });
  });

  it('custom error text', async () => {
    config.targetUrl = '';
    config.errorText = 'Повторите пожалуйста';

    const response = await handler({
      request: {
        command: 'foo'
      },
      session: 1,
      version: 2,
    });

    assert.deepEqual(response, {
      response: {
        text: 'Повторите пожалуйста',
        tts: 'Повторите пожалуйста',
        end_session: false
      },
      session: 1,
      version: 2,
    });
  });

  it('invalid request', async () => {
    const scope = nock('http://localhost')
      .post('/')
      .reply(200, {
        response: {
          text: 'bar'
        }
      });

    const response = await handler({
      foo: 42
    });

    scope.done();
    assert.deepEqual(response, {
      response: {
        text: 'bar',
      },
    });
  });

  it('telegram notification', async () => {
    config.targetUrl = '';
    config.tgNotifyUrl = 'https://api.telegram.org/bot123/sendMessage?chat_id=456';

    const scope = nock('https://api.telegram.org')
      .post('/bot123/sendMessage?chat_id=456', body => body.text.includes('Please set targetUrl in config.js'))
      .reply(200, { ok: true });

    await handler({});

    scope.done();
  });

});