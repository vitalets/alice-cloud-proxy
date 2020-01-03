describe('allowed-users', () => {

  it('allowed user', async () => {
    const scope = nock('http://localhost')
      .post('/')
      .reply(200, {
        response: {
          text: 'world',
          end_session: false
        },
        session: {
          user_id: 'foo'
        },
        version: 2,
      });

    options.allowedUsers = ['foo'];

    const response = await handler({
      request: {
        command: 'hello'
      },
      session: {
        user_id: 'foo'
      },
      version: 2,
    });

    assert.equal(scope.isDone(), true);
    assert.deepEqual(response, {
      response: {
        text: 'world',
        end_session: false
      },
      session: {
        user_id: 'foo'
      },
      version: 2,
    });
  });

  it('not allowed user', async () => {
    const scope = nock('http://localhost')
      .post('/')
      .reply(200, { });

    options.allowedUsers = ['foo'];

    const response = await handler({
      request: {
        command: 'hello'
      },
      session: {
        user_id: 'bar'
      },
      version: 2,
    });

    assert.equal(scope.isDone(), false);
    assert.deepEqual(response, {
      response: {
        text: 'Это приватный навык. Для выхода скажите "Хватит".',
        end_session: false
      },
      session: {
        user_id: 'bar'
      },
      version: 2,
    });
  });

});
