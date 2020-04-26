describe('errors', () => {

  it('no target url', async () => {
    config.targetUrl = '';

    const response = await callFn({
      request: {
        command: 'foo'
      },
      session: {
        user_id: '123'
      },
      version: 2,
    });

    assert.deepEqual(response, {
      response: {
        text: 'Please set targetUrl in config.js (userId: 123)',
        tts: 'Ошибка',
        end_session: false
      },
      session: {
        user_id: '123'
      },
      version: 2,
    });
  });

  it('http timeout', async () => {
    nock('http://localhost')
      .post('/')
      .delay(300)
      .reply(200);

    const response = await callFn({
      request: {
        command: 'foo'
      },
      session: {
        user_id: '123456_78'
      },
      version: 2,
    });

    assert.deepEqual(response, {
      response: {
        text: 'Request timeout: 250 ms (userId: 123456)', // userId обрезается до 6 символов
        tts: 'Ошибка',
        end_session: false
      },
      session: {
        user_id: '123456_78'
      },
      version: 2,
    });
  });

  it('http error', async () => {
    const scope = nock('http://localhost')
      .post('/')
      // nock can't set statusMessage
      // see: https://github.com/nock/nock/issues/469
      .reply(500);

    const response = await callFn({
      request: {
        command: 'foo'
      },
      session: {
        user_id: '123'
      },
      version: 2,
    });

    scope.done();
    assert.deepEqual(response, {
      response: {
        text: '500 null http://localhost (userId: 123)',
        tts: 'Ошибка',
        end_session: false
      },
      session: {
        user_id: '123'
      },
      version: 2,
    });
  });

  it('network error', async () => {
    const scope = nock('http://localhost')
      .post('/')
      .replyWithError('err message');

    const response = await callFn({
      request: {
        command: 'foo'
      },
      session: {
        user_id: '123'
      },
      version: 2,
    });

    scope.done();
    assert.deepEqual(response, {
      response: {
        text: 'err message (userId: 123)',
        tts: 'Ошибка',
        end_session: false
      },
      session: {
        user_id: '123'
      },
      version: 2,
    });
  });

  it('custom error text', async () => {
    config.targetUrl = '';
    config.errorText = 'Повторите пожалуйста';

    const response = await callFn({
      request: {
        command: 'foo'
      },
      session: {
        user_id: '123'
      },
      version: 2,
    });

    assert.deepEqual(response, {
      response: {
        text: 'Повторите пожалуйста',
        tts: 'Повторите пожалуйста',
        end_session: false
      },
      session: {
        user_id: '123'
      },
      version: 2,
    });
  });

  it('telegram notification', async () => {
    config.targetUrl = '';
    config.tgNotifyUrl = 'https://api.telegram.org/bot123/sendMessage?chat_id=456';
    config.tgNotifyPrefix = '[тест]';

    const scope = nock('https://api.telegram.org')
      .post('/bot123/sendMessage?chat_id=456',
          body => body.text.includes('[тест] Error: Please set targetUrl in config.js (userId: 123)')
      )
      .reply(200, { ok: true });

    await callFn({
      request: {
        command: 'foo'
      },
      session: {
        user_id: '123'
      },
      version: 2,
    });

    scope.done();
  });

  it('if no user id, just dont attach it to error', async () => {
    config.targetUrl = '';

    const response = await callFn({
      request: {
        command: 'foo'
      },
      session: {
        // no user_id field
        // user_id: '123'
      },
      version: 2,
    });

    assert.deepEqual(response, {
      response: {
        text: 'Please set targetUrl in config.js',
        tts: 'Ошибка',
        end_session: false
      },
      session: {

      },
      version: 2,
    });
  });

});
