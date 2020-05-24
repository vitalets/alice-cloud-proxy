describe('ping', () => {

  it('respond pong', async () => {
    const scope = nock('http://localhost')
      .post('/')
      .reply(200, { });

    const response = await callFn({
      request: {
        command: 'ping'
      },
      session: {
        user_id: 'user12345678'
      },
      version: '1.0',
    });

    assert.equal(scope.isDone(), false);
    assert.deepEqual(response, {
      response: {
        text: 'pong',
        end_session: false
      },
      version: '1.0',
    });
  });

});
