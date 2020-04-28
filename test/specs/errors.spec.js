describe('errors', () => {

  it('no target url', async () => {
    config.targetUrl = '';

    const response = await callFn({
      request: {
        command: 'foo'
      },
      session: {
        user_id: 'user12345678'
      },
      version: 2,
    });

    assert.deepEqual(response, {
      response: {
        text: 'Please set targetUrl in config.js [req123-user12]',
        tts: 'Ошибка',
        end_session: false
      },
      session: {
        user_id: 'user12345678'
      },
      version: 2,
    });
  });

  it('proxy http timeout', async () => {
    nock('http://localhost')
      .post('/')
      .delay(300)
      .reply(200);

    const { response } = await callFn({
      request: {
        command: 'foo'
      },
      session: {
        user_id: '123'
      },
      version: 2,
    });

    assert.include(response.text, 'Request timeout: 250 ms');
    assert.include(response.text, '(socket:');
  });

  // Чтобы это протестить нужно дополнительно подписываться req.on('timeout') и все аккуратно чистить.
  // Пока лучше оставиим общий таймаут, а время коннекта к сокету будем смотреть по событию socket.
  // https://github.com/nock/nock#socket-timeout
  it.skip('proxy socket timeout', async () => {
    nock('http://localhost')
      .post('/')
      .socketDelay(300)
      .reply(200);

    const { response } = await callFn({
      request: {
        command: 'foo'
      },
      session: {
        user_id: '123'
      },
      version: 2,
    });

    assert.include(response.text, 'Request timeout: 250 ms');
    assert.include(response.text, '(socket:');
    assert.include(response.text, '(userId: 123)');
  });

  it('proxy 500', async () => {
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
        text: '500 null http://localhost [req123-123]',
        tts: 'Ошибка',
        end_session: false
      },
      session: {
        user_id: '123'
      },
      version: 2,
    });
  });

  it('proxy invalid JSON', async () => {
    const scope = nock('http://localhost')
      .post('/')
      .reply(200);

    const response = await callFn({
      request: {
        command: 'foo'
      },
      session: {
        user_id: 'user1234'
      },
      version: 2,
    });

    scope.done();
    assert.deepEqual(response, {
      response: {
        text: 'Unexpected end of JSON input [req123-user12]',
        tts: 'Ошибка',
        end_session: false
      },
      session: {
        user_id: 'user1234'
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
        text: 'err message [req123-123]',
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
          body => body.text.includes('[тест] Please set targetUrl in config.js [req123-user12]')
      )
      .reply(200, { ok: true });

    await callFn({
      request: {
        command: 'foo'
      },
      session: {
        user_id: 'user1234'
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
        text: 'Please set targetUrl in config.js [req123]',
        tts: 'Ошибка',
        end_session: false
      },
      session: {

      },
      version: 2,
    });
  });

});
